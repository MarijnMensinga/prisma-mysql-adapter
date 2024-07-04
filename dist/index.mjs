// src/mysql.ts
import { Debug, err, ok } from "@prisma/driver-adapter-utils";

// src/conversion.ts
import { ColumnTypeEnum } from "@prisma/driver-adapter-utils";
var MySqlCodes = {
  0: "DECIMAL",
  1: "TINY",
  2: "SHORT",
  3: "LONG",
  4: "FLOAT",
  5: "DOUBLE",
  6: "NULL",
  7: "TIMESTAMP",
  8: "LONGLONG",
  9: "INT24",
  10: "DATE",
  11: "TIME",
  12: "DATETIME",
  13: "YEAR",
  14: "NEWDATE",
  15: "VARCHAR",
  16: "BIT",
  245: "JSON",
  246: "NEWDECIMAL",
  247: "ENUM",
  248: "SET",
  249: "TINY_BLOB",
  250: "MEDIUM_BLOB",
  251: "LONG_BLOB",
  252: "BLOB",
  253: "VAR_STRING",
  254: "STRING",
  255: "GEOMETRY"
};
var MySqlTypes = {
  DECIMAL: 0,
  TINY: 1,
  SHORT: 2,
  LONG: 3,
  FLOAT: 4,
  DOUBLE: 5,
  NULL: 6,
  TIMESTAMP: 7,
  LONGLONG: 8,
  INT24: 9,
  DATE: 10,
  TIME: 11,
  DATETIME: 12,
  YEAR: 13,
  NEWDATE: 14,
  VARCHAR: 15,
  BIT: 16,
  JSON: 245,
  NEWDECIMAL: 246,
  ENUM: 247,
  SET: 248,
  TINY_BLOB: 249,
  MEDIUM_BLOB: 250,
  LONG_BLOB: 251,
  BLOB: 252,
  VAR_STRING: 253,
  STRING: 254,
  GEOMETRY: 255
};
var MySqlFlags = {
  NOT_NULL: 1,
  PRI_KEY: 2,
  UNIQUE_KEY: 4,
  MULTIPLE_KEY: 8,
  BLOB: 16,
  UNSIGNED: 32,
  ZEROFILL: 64,
  BINARY: 128,
  ENUM: 256,
  AUTO_INCREMENT: 512,
  TIMESTAMP: 1024,
  SET: 2048,
  NO_DEFAULT_VALUE: 4096,
  ON_UPDATE_NOW: 8192,
  NUM: 32768
};
var typeCast = (field, next) => {
  if (field.type === "TIMESTAMP") {
    return field.string();
  }
  if (field.type === "DATETIME") {
    return field.string();
  }
  if (field.type === "DATE") {
    return field.string();
  }
  if (field.type === "LONGLONG") {
    return field.string();
  }
  return next();
};
var UnsupportedNativeDataType = class extends Error {
  type;
  constructor(field) {
    super();
    this.type = field.columnType && MySqlCodes[field.columnType] || "Unknown";
    this.message = `Unsupported native data type: ${this.type}`;
  }
};
function fieldToColumnType(field) {
  if (isReal(field)) return ColumnTypeEnum.Numeric;
  if (isFloat(field)) return ColumnTypeEnum.Float;
  if (isDouble(field)) return ColumnTypeEnum.Double;
  if (isInt32(field)) return ColumnTypeEnum.Int32;
  if (isInt64(field)) return ColumnTypeEnum.Int64;
  if (isDateTime(field)) return ColumnTypeEnum.DateTime;
  if (isTime(field)) return ColumnTypeEnum.Time;
  if (isDate(field)) return ColumnTypeEnum.Date;
  if (isText(field)) return ColumnTypeEnum.Text;
  if (isBytes(field)) return ColumnTypeEnum.Bytes;
  if (isBool(field)) return ColumnTypeEnum.Boolean;
  if (isJson(field)) return ColumnTypeEnum.Json;
  if (isEnum(field)) return ColumnTypeEnum.Enum;
  if (isNull(field)) return ColumnTypeEnum.Int32;
  throw new UnsupportedNativeDataType(field);
}
function isReal(field) {
  return field.columnType === MySqlTypes.DECIMAL || field.columnType === MySqlTypes.NEWDECIMAL;
}
function isFloat(field) {
  return field.columnType === MySqlTypes.FLOAT;
}
function isDouble(field) {
  return field.columnType === MySqlTypes.DOUBLE;
}
function isInt32(field) {
  return field.columnType === MySqlTypes.TINY || field.columnType === MySqlTypes.SHORT || field.columnType === MySqlTypes.YEAR || field.columnType === MySqlTypes.LONG && !hasFlag(field.flags, MySqlFlags.UNSIGNED) || field.columnType === MySqlTypes.INT24 && !hasFlag(field.flags, MySqlFlags.UNSIGNED);
}
function isInt64(field) {
  return field.columnType === MySqlTypes.LONGLONG || field.columnType === MySqlTypes.LONG && hasFlag(field.flags, MySqlFlags.UNSIGNED) || field.columnType === MySqlTypes.INT24 && hasFlag(field.flags, MySqlFlags.UNSIGNED);
}
function isDateTime(field) {
  return field.columnType === MySqlTypes.TIMESTAMP || field.columnType === MySqlTypes.DATETIME;
}
function isTime(field) {
  return field.columnType === MySqlTypes.TIME;
}
function isDate(field) {
  return field.columnType === MySqlTypes.DATE || field.columnType === MySqlTypes.NEWDATE;
}
function isText(field) {
  return field.columnType === MySqlTypes.VARCHAR || field.columnType === MySqlTypes.VAR_STRING || field.columnType === MySqlTypes.STRING || field.columnType === MySqlTypes.TINY_BLOB && field.characterSet !== 63 || field.columnType === MySqlTypes.MEDIUM_BLOB && field.characterSet !== 63 || field.columnType === MySqlTypes.LONG_BLOB && field.characterSet !== 63 || field.columnType === MySqlTypes.BLOB && field.characterSet !== 63;
}
function isBytes(field) {
  return field.columnType === MySqlTypes.TINY_BLOB && field.characterSet === 63 || field.columnType === MySqlTypes.MEDIUM_BLOB && field.characterSet === 63 || field.columnType === MySqlTypes.LONG_BLOB && field.characterSet === 63 || field.columnType === MySqlTypes.BLOB && field.characterSet === 63 || field.columnType === MySqlTypes.BIT && field.columnLength && field.columnLength > 1;
}
function isBool(field) {
  return field.columnType === MySqlTypes.BIT && field.columnLength === 1;
}
function isJson(field) {
  return field.columnType === MySqlTypes.JSON;
}
function isEnum(field) {
  return field.columnType === MySqlTypes.ENUM || hasFlag(field.flags, MySqlFlags.ENUM);
}
function isNull(field) {
  return field.columnType === MySqlTypes.NULL;
}
function hasFlag(flags, target) {
  return flags & target;
}

// src/mysql.ts
var debug = Debug("prisma:driver-adapter:mysql");
var MySqlQueryable = class {
  constructor(client) {
    this.client = client;
    this.adapterName = "prisma-mysql-adapter";
  }
  provider = "mysql";
  /**
   * Execute a query given as SQL, interpolating the given parameters.
   */
  async queryRaw(query) {
    const tag = "[js::query_raw]";
    debug(`${tag} %O`, query);
    const res = await this.performIO({
      sql: query.sql,
      values: query.args,
      rowsAsArray: true,
      typeCast
    });
    if (!res.ok) {
      return err(res.error);
    }
    const { data, fields } = res.value;
    const columnNames = fields.map((field) => field.name);
    const rows = Array.isArray(data) ? data : [];
    const lastInsertId = "insertId" in data ? data.insertId.toString() : void 0;
    let columnTypes = [];
    try {
      columnTypes = fields.map((field) => fieldToColumnType(field));
    } catch (error) {
      if (error instanceof UnsupportedNativeDataType) {
        return err({ kind: "UnsupportedNativeDataType", type: error.type });
      }
      throw error;
    }
    return ok({
      columnNames,
      columnTypes,
      rows,
      lastInsertId
    });
  }
  /**
   * Execute a query given as SQL, interpolating the given parameters and
   * returning the number of affected rows.
   * Note: Queryable expects a u64, but napi.rs only supports u32.
   */
  async executeRaw(query) {
    const tag = "[js::execute_raw]";
    debug(`${tag} %O`, query);
    const res = await this.performIO({ sql: query.sql, values: query.args });
    if (!res.ok) {
      return err(res.error);
    }
    return res.map(({ data }) => data.affectedRows);
  }
  /**
   * Run a query against the database, returning the result set.
   * Should the query fail due to a connection error, the connection is
   * marked as unhealthy.
   */
  async performIO(options) {
    try {
      const [data, fields = []] = await this.client.query(options);
      return ok({ data, fields });
    } catch (e) {
      const error = e;
      debug("Error in performIO: %O", error);
      Object.assign(e, {
        kind: "Mysql",
        code_name: e.code,
        code: error.errno,
        message: error.message,
        state: error.state,
        meta: {
          ...error,
          code_name: e.code,
          code: error.errno
        }
      });
      throw e;
    }
  }
};
var MySqlTransaction = class extends MySqlQueryable {
  constructor(client, options) {
    super(client);
    this.options = options;
    this.adapterName = "prisma-mysql-adapter";
  }
  async commit() {
    debug(`[js::commit]`);
    this.client.release();
    return ok(void 0);
  }
  async rollback() {
    debug(`[js::rollback]`);
    this.client.release();
    return ok(void 0);
  }
};
var PrismaMySql = class extends MySqlQueryable {
  constructor(client, options) {
    super(client);
    this.options = options;
    this.adapterName = "prisma-mysql-adapter";
  }
  getConnectionInfo() {
    return ok({
      schemaName: this.options?.schema
    });
  }
  async startTransaction() {
    const options = {
      usePhantomQuery: false
    };
    const tag = "[js::startTransaction]";
    debug(`${tag} options: %O`, options);
    const connection = await this.client.getConnection();
    return ok(new MySqlTransaction(connection, options));
  }
};
export {
  PrismaMySql
};
