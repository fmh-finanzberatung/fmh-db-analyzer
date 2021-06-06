module.exports = `
  
  enum OrderDirection {
    DESC
    ASC
  }
  
  enum intervalType {
    OPEN    # excludes endpoints 
    CLOSED  # includes endpoints 
  }
  
  type DateTime {
    year: Int
    month: Int
    date: Int
    hour: Int
    minute: Int
    second: Int
  }
  
  input PaginationInput {
    page: Int = 1
    pageSize: Int = 10
  }

  input IntRange {
    startVal: Int 
    startType: intervalType = CLOSED 
    endVal: Int 
    endType: intervalType = CLOSED 
  }
  
  input IDRange {
    startVal: Int 
    startType: intervalType = CLOSED 
    endVal: Int 
    endType: intervalType = CLOSED 
  }

  input DateTimeInput {
    year: Int
    month: Int
    date: Int
    hour: Int
    minute: Int
    second: Int
  }

  input DateTimeInputRange {
    startVal: DateTimeInput 
    startType: intervalType = CLOSED 
    endVal: DateTimeInput 
    endType: intervalType = CLOSED 
  }

  input StringRange {
    startVal: String 
    startType: intervalType = CLOSED 
    endVal: String 
    endType: intervalType = CLOSED 
  }
  
  type Pagination {
    page: Int
    pageSize: Int
    total: Int
    pages: Int
  }
 
`;