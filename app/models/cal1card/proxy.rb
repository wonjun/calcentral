module Cal1card
  class Proxy < BaseProxy

    include ClassLogger
    include Cache::UserCacheExpiry

    APP_ID = "Cal1Card"

    def initialize(options = {})
      super(Settings.cal1card_proxy, options)
    end

    def get
      self.class.smart_fetch_from_cache({id: @uid}) do
        internal_get
      end
    end

    private

    def internal_get
      return {} unless Settings.features.cal1card
      if @fake
        logger.info "Fake = #@fake, getting data from XML fixture file; user #{@uid}; cache expiration #{self.class.expires_in}"
        xml = File.read(Rails.root.join('fixtures', 'xml', 'cal1card_feed.xml').to_s)
      else
        url = "#{@settings.feed_url}?uid=#{@uid}"
        logger.info "Fake = #@fake; Making request to #{url} on behalf of user #{@uid}; cache expiration #{self.class.expires_in}"
        response = HTTParty.get(
          url,
          basic_auth: {username: @settings.username, password: @settings.password},
          timeout: Settings.application.outgoing_http_timeout
        )
        if response.code >= 400
          body = "Cal1Card is currently unavailable. Please try again later."
          raise Errors::ProxyError.new("Connection failed: #{response.code} #{response.body}; url = #{url}", {
            body: body,
            statusCode: response.code
          })
        else
          xml = response.body
        end
        logger.debug "Cal1Card remote response: #{response.inspect}"
      end
      convert_xml(xml)[:cal1card].merge({
        statusCode: 200
      })
    end

    def convert_xml(xml)
      hash = Hash.from_xml(xml)
      HashConverter.camelize hash
    end

  end
end
