import { DriverAdapter, Result, ConnectionInfo, Transaction, Queryable, Query, ResultSet } from '@prisma/driver-adapter-utils';
import { Pool, PoolConnection } from 'mysql2/promise';

declare class MySqlQueryable<ClientT extends Pool | PoolConnection> implements Queryable {
    protected readonly client: ClientT;
    readonly provider = "mysql";
    readonly adapterName: string & {};
    constructor(client: ClientT);
    /**
     * Execute a query given as SQL, interpolating the given parameters.
     */
    queryRaw(query: Query): Promise<Result<ResultSet>>;
    /**
     * Execute a query given as SQL, interpolating the given parameters and
     * returning the number of affected rows.
     * Note: Queryable expects a u64, but napi.rs only supports u32.
     */
    executeRaw(query: Query): Promise<Result<number>>;
    /**
     * Run a query against the database, returning the result set.
     * Should the query fail due to a connection error, the connection is
     * marked as unhealthy.
     */
    private performIO;
}
type PrismaMySqlOptions = {
    schema?: string;
};
declare class PrismaMySql extends MySqlQueryable<Pool> implements DriverAdapter {
    private options?;
    readonly adapterName: string & {};
    constructor(client: Pool, options?: PrismaMySqlOptions | undefined);
    getConnectionInfo(): Result<ConnectionInfo>;
    startTransaction(): Promise<Result<Transaction>>;
}

export { PrismaMySql };
