/*
 * @Author       : Chr_
 * @Date         : 2021-08-30 14:40:51
 * @LastEditors  : Chr_
 * @LastEditTime : 2021-09-01 20:47:11
 * @Description  : 处理配置文件
*/

import * as path from 'path';
import * as vscode from 'vscode';

import { FileInfo, loadConfigFile, saveConfigFile } from './cfgFileHandler';


const dirUSR = '/user';
const dirSYS = '/system';
const fileFAV = 'favorite.json';

//初始化数据目录
export async function initDirs(baseDir: vscode.Uri) {
    const { fs } = vscode.workspace;

    try {
        await fs.createDirectory(vscode.Uri.parse(baseDir + dirUSR));
        await fs.createDirectory(vscode.Uri.parse(baseDir + dirSYS));
    }
    catch (e) {
        vscode.window.showErrorMessage(`创建数据文件夹失败: ${e}`);
        console.log(e);
        return;
    }
}
//读取用户配置文件
export async function initUserCfgFiles(baseDir: vscode.Uri): Promise<FileInfo[]> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { FileType } = vscode;
    const { fs } = vscode.workspace;

    const usrDir = vscode.Uri.parse(baseDir + dirUSR);
    const cfgs: FileInfo[] = [];

    let files = await fs.readDirectory(usrDir);

    //并行读取数据文件
    const pList: Array<Promise<void>> = [];

    for (const [name, type] of files) {
        if (type === FileType.File && name.endsWith('.json')) {

            const filePath = vscode.Uri.parse(usrDir + path.sep + name);

            pList.push(
                new Promise<void>((resolve, reject) => {
                    loadConfigFile(filePath)
                        .then(result => {
                            if (result !== null) { cfgs.push(result); }
                        })
                        .catch(reason => {
                            console.error(reason);
                        })
                        .finally(() => {
                            resolve();
                        });
                })
            );
        }
    }

    await Promise.all(pList);

    cfgs.sort((a, b) => {
        return a.cfgbody.dispname > b.cfgbody.dispname ? 1 : -1;
    });


    return cfgs;
}
//读取收藏夹配置文件
export async function initFavoriteCfgFile(baseDir: vscode.Uri): Promise<FileInfo> {
    const sysDir = vscode.Uri.parse(baseDir + dirSYS);
    const filePath = vscode.Uri.parse(sysDir + path.sep + fileFAV);

    try {
        let result = await loadConfigFile(filePath);
        if (result !== null) {
            return result;
        } else {
            // vscode.window.showErrorMessage('收藏夹解析失败');
            throw new Error('收藏夹解析失败');
        }
    }
    catch (e) {
        //文件不存在
        console.log(e);

        let cfgbody = { dispname: '', author: '', version: '', describe: '', items: [] };
        let fav = { filepath: filePath.fsPath, cfgbody };

        await saveFavoriteCfgFile(fav);
        return fav;
    }
}

//保存用户配置文件
export async function saveUserCfgFile(cfgs: FileInfo[]) {
    //并行写入数据文件
    const pList: Array<Promise<void>> = [];

    for (const cfg of cfgs) {
        pList.push(
            new Promise<void>((resolve, reject) => {
                saveConfigFile(cfg)
                    .then()
                    .catch(reason => {
                        console.error(reason);
                    })
                    .finally(() => {
                        resolve();
                    });
            })
        );

    }

    await Promise.all(pList);
}

//保存收藏夹配置文件
export async function saveFavoriteCfgFile(cfg: FileInfo) {
    await saveConfigFile(cfg);
}