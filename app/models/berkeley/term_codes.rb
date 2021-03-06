module Berkeley
  module TermCodes
    extend self

    def codes
      @codes ||= {
        :B => "Spring",
        :C => "Summer",
        :D => "Fall"
      }
    end

    def names
      @names ||= init_names
    end

    def to_english(term_yr, term_cd)
      term = codes[term_cd.to_sym]
      unless term
        raise ArgumentError, "No such term code: #{term_cd}"
      end
      "#{term} #{term_yr}"
    end

    def to_slug(term_yr, term_cd)
      term = codes[term_cd.to_sym]
      unless term
        raise ArgumentError, "No such term code: #{term_cd}"
      end
      "#{term.downcase}-#{term_yr}"
    end

    def to_code(name)
      name = names[name.downcase]
      unless name
        raise ArgumentError, "No such term code: #{name}"
      end
      name
    end

    def from_english(str)
      if (parsed = /(?<term_name>[[:alpha:]]+) (?<term_yr>\d+)/.match(str)) && (term_cd = to_code(parsed[:term_name]))
        {
          term_yr: parsed[:term_yr],
          term_cd: term_cd
        }
      else
        nil
      end
    end

    def from_slug(slug)
      if (parsed = /(?<term_name>[[:alpha:]]+)-(?<term_yr>\d+)/.match(slug)) && (term_cd = to_code(parsed[:term_name]))
        {
          term_yr: parsed[:term_yr],
          term_cd: term_cd
        }
      else
        nil
      end
    end

    private

    def init_names
      names = {}
      codes.keys.each do |key|
        name = codes[key]
        names[name.downcase] = key.to_s
      end
      names
    end

  end
end
