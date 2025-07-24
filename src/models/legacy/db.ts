const connectionParams = {
    host: 'blitz.cs.niu.edu',
    port: 3306,
    user: 'student',
    password: 'student',
    database: 'csci467'    
};

import { Sequelize } from 'sequelize';
import createLegacyCustomerModel, { LegacyCustomer } from './customer';

export type { LegacyCustomerAttributes } from './customer';
export { LegacyCustomer };

export const legacy_db = {
    LegacyCustomer: null as typeof LegacyCustomer | null,
    initialize
};

async function initialize() {
    // connect to db
    const sequelize = new Sequelize(
        `mysql://${connectionParams.user}:${connectionParams.password}@${connectionParams.host}:${connectionParams.port}/${connectionParams.database}`, {
        dialect: 'mysql',
        dialectModule: require('mysql2')
    });

    legacy_db.LegacyCustomer = createLegacyCustomerModel(sequelize);
}