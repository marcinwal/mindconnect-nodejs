import * as fs from "fs";
import * as path from "path";
import { IMindConnectConfiguration } from "..";
import debug = require("debug");
import _ = require("lodash");
const log = debug("mindconnect-storage");

/**
 * Per default, the library stores the agent settings in the directory .mc
 * You can pass a class which implements a ConfigurationStorage in the constructor if you want to store
 * the settings somewhere else. (e.g. database, encrypted file system etc)
 * @export
 * @interface ConfigurationStorage
 */
export interface IConfigurationStorage {
    GetConfig(config: IMindConnectConfiguration): IMindConnectConfiguration;
    SaveConfig(config: IMindConnectConfiguration): Promise<IMindConnectConfiguration>;
}

export function IsConfigurationStorage(arg: any): arg is IConfigurationStorage {
    return arg.GetConfig !== undefined && arg.SaveConfig !== undefined;
}

/**
 * DefaultStorage, stores the config files in the _basePath folder
 *
 * @export
 * @class DefaultStorage
 */
export class DefaultStorage implements IConfigurationStorage {

    public GetConfig(configuration: IMindConnectConfiguration): IMindConnectConfiguration {

        try {
            const json = <IMindConnectConfiguration>require(path.resolve(`${this._basePath}/${configuration.content.clientId}.json`));
            if (_.isEqual(json.content, configuration.content)) {
                return json;

            } else {
                log("The configuration has changed we will onboard again.");
            }

        } catch (err) {
            log(`There is no configuration stored yet for agent with id ${configuration.content.clientId}`);
        }

        return configuration;
    }

    public async SaveConfig(config: IMindConnectConfiguration): Promise<IMindConnectConfiguration> {
        const promise = new Promise<IMindConnectConfiguration>((resolve, reject) => {
            const fileName = `${this._basePath}/${config.content.clientId}.json`;
            const data = JSON.stringify(config);
            fs.writeFile(fileName, data, err => {
                if (err)
                    reject(err);
                else
                    resolve(config);
            });
        });
        return promise;
    }

    constructor(private _basePath: string) {

        if (!fs.existsSync(this._basePath)) {
            fs.mkdirSync(this._basePath);
        }
    }
}