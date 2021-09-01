/*
 * @Author       : Chr_
 * @Date         : 2021-08-30 17:20:25
 * @LastEditors  : Chr_
 * @LastEditTime : 2021-09-02 01:37:51
 * @Description  : 配置文件读写相关
 */

import * as path from 'path';

import * as vscode from 'vscode';


export enum ArgType { none, bool, str, num, list };

export interface ArgObject {
    name: string,
    disp: string,
    value: boolean | string | number | [] | null,
    type: ArgType,
    doc: string,
}
export interface ItemObject {
    name: string,
    disp: string,
    args: ArgObject[],
    doc: string,
}
export interface CfgObject {
    dispname: string,
    author: string,
    version: string,
    describe: string,
    items: ItemObject[]
}
export interface FileInfo {
    filepath: string,
    cfgbody: CfgObject
}

function convertType(type: any, value: any): [ArgType, boolean | string | number | [] | null] {
    switch (type) {
        case 1:
        case '1':
        case '布尔':
        case 'b':
        case 'bool':
        case 'boolen':
            return [ArgType.bool, Boolean(value)];
        case 2:
        case '2':
        case '文本':
        case 's':
        case 'str':
        case 'string':
            if (typeof value !== 'string') {
                value = value ? String(value) : '';
            }
            return [ArgType.str, value];
        case 3:
        case '3':
        case '数字':
        case 'n':
        case 'num':
        case 'number':
            if (typeof value !== 'number') {
                value = value ? Number.parseFloat(value) : 0;
            }
            return [ArgType.num, value];
        case 4:
        case '4':
        case '列表':
        case 'l':
        case 'list':
            return [ArgType.list, value];
        default:
            return [ArgType.none, null];
    }
}

//读取配置文件
export async function loadConfigFile(fPath: vscode.Uri): Promise<FileInfo | null> {
    const { fs } = vscode.workspace;

    let filepath: string = fPath.fsPath;

    try {
        let data = await fs.readFile(fPath);

        let { dispname, author, version, describe, items } = JSON.parse(data.toString());

        dispname = dispname || path.basename(filepath).split('.')[0];
        author = author || "";
        version = version || "";
        describe = describe || "";
        items = items || [];

        let vItems = [];

        for (let item of items) {
            let { name, disp, args, doc } = item;

            if (!name || name.length === 0) {
                continue;
            }

            let vArgs = [];

            let first = true;

            for (let arg of args) {
                let { name, disp, value, type, doc } = arg;

                if (!name || name.length === 0) {
                    if (first) {
                        first = false;
                    } else {
                        continue;
                    }
                }

                disp = disp || name;

                [type, value] = convertType(type, value);

                doc = doc || "";

                vArgs.push({ name, disp, value, type, doc });
            }

            disp = disp || name;
            doc = doc || "";

            vItems.push({ name, disp, args: vArgs, doc });
        }

        let cfgbody = { dispname, author, version, describe, items: vItems };

        return { filepath, cfgbody };
    }
    catch (e) {
        console.log(e);
        return null;
    }
}


//写入配置文件
export async function saveConfigFile(cfg: FileInfo) {
    const { fs } = vscode.workspace;
    const uri = vscode.Uri.from({ scheme: 'file', path: cfg.filepath });
    const buff = Buffer.from(JSON.stringify(cfg.cfgbody, null, 2));
    await fs.writeFile(uri, buff);
}