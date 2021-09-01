/*
 * @Author       : Chr_
 * @Date         : 2021-08-27 13:48:10
 * @LastEditors  : Chr_
 * @LastEditTime : 2021-09-02 02:21:15
 * @Description  : 插件入口
*/

import * as vscode from 'vscode';

import { initDirs, initFavoriteCfgFile, initUserCfgFiles, saveFavoriteCfgFile, saveUserCfgFile } from './fileUtils';

import { CfgItem, FavrCfgProvider, UserCfgProvider } from './cfgDataProvider';
import { ArgObject, ArgType, CfgObject, FileInfo, ItemObject } from './cfgFileHandler';
import path = require('path');
import { getInput, str2ArgType } from './utils';


let gVars = { };
let gCfgs: FileInfo[] = [];
let gFavr: FileInfo;
let usrProvider: UserCfgProvider;
let favrProvider: FavrCfgProvider;
let dataPath: vscode.Uri;

export async function activate(context: vscode.ExtensionContext) {
    dataPath = context.globalStorageUri;

    await initDirs(dataPath);

    gCfgs = await initUserCfgFiles(dataPath);

    gFavr = await initFavoriteCfgFile(dataPath);

    usrProvider = new UserCfgProvider(gCfgs);

    const viewItems = vscode.window.createTreeView('items', {
        treeDataProvider: usrProvider
    });

    favrProvider = new FavrCfgProvider(gFavr);

    const viewFavorite = vscode.window.createTreeView('favorite', {
        treeDataProvider: favrProvider
    });

    Object.assign(gVars, { viewFavorite, viewItems });

    const { registerCommand } = vscode.commands;

    context.subscriptions.push(registerCommand('nnToolsTab.reloadItem', () => { reload(true); }));
    context.subscriptions.push(registerCommand('nnToolsTab.reloadFavo', () => { reload(false); }));
    context.subscriptions.push(registerCommand('nnToolsTab.openDir', openDir));
    context.subscriptions.push(registerCommand('nnToolsTab.addFavorite', (node: CfgItem) => { addFavorite(node); }));
    context.subscriptions.push(registerCommand('nnToolsTab.delFavorite', (node: CfgItem) => { delFavorite(node); }));
    context.subscriptions.push(registerCommand('nnToolsTab.delAllFavorite', delAllFavorite));
    context.subscriptions.push(registerCommand('nnToolsTab.showDoc', (node: CfgItem) => { showDoc(node); }));
    context.subscriptions.push(registerCommand('nnToolsTab.exportFavorite', exportFavorite));
    context.subscriptions.push(registerCommand('nnToolsTab.importFavorite', (node: CfgItem) => { importFavorite(node); }));
    context.subscriptions.push(registerCommand('nnToolsTab.editFileInfo', (node: CfgItem) => { editInfo(node); }));
    context.subscriptions.push(registerCommand('nnToolsTab.insertItem', (node: CfgItem) => { insertItem(node); }));
    context.subscriptions.push(registerCommand('nnToolsTab.editItemI', (node: CfgItem) => { editItem(node, true); }));
    context.subscriptions.push(registerCommand('nnToolsTab.editItemF', (node: CfgItem) => { editItem(node, false); }));
    context.subscriptions.push(registerCommand('nnToolsTab.addItem', addItem));
    context.subscriptions.push(registerCommand('nnToolsTab.delItem', (node: CfgItem) => { delItem(node); }));
    context.subscriptions.push(registerCommand('nnToolsTab.delRoot', (node: CfgItem) => { delRoot(node); }));
    context.subscriptions.push(registerCommand('nnToolsTab.addArgvI', (node: CfgItem) => { addArgv(node, true); }));
    context.subscriptions.push(registerCommand('nnToolsTab.addArgvF', (node: CfgItem) => { addArgv(node, false); }));
    context.subscriptions.push(registerCommand('nnToolsTab.editArgvI', (node: CfgItem) => { editArgv(node, true); }));
    context.subscriptions.push(registerCommand('nnToolsTab.delArgvI', (node: CfgItem) => { delArgv(node, true); }));
    context.subscriptions.push(registerCommand('nnToolsTab.editArgvF', (node: CfgItem) => { editArgv(node, false); }));
    context.subscriptions.push(registerCommand('nnToolsTab.delArgvF', (node: CfgItem) => { delArgv(node, false); }));

    console.log('Plugin 已加载');

    await saveUserCfgFile(gCfgs);
    await saveFavoriteCfgFile(gFavr);
}

export function deactivate() {
    console.log('Plugin 已卸载');
}

//重载列表
async function reload(isItem: boolean = true) {
    await initDirs(dataPath);
    if (isItem) {
        gCfgs = await initUserCfgFiles(dataPath);
        usrProvider.refreshItem(gCfgs);
    } else {
        gFavr = await initFavoriteCfgFile(dataPath);
        favrProvider.refreshItem(gFavr);
    }
    // vscode.window.showInformationMessage('重载完成');
}
//显示数据目录
function openDir() {
    let fpath = path.join(dataPath.fsPath, 'user');
    vscode.window.showInformationMessage(`数据文件目录: ${fpath}`);
}
//添加收藏
async function addFavorite(node: CfgItem) {
    let cfg = node.cfg;
    if (!("value" in cfg) && "doc" in cfg) {
        gFavr.cfgbody.items.push(cfg);
        await saveFavoriteCfgFile(gFavr);
    }
    reload(false);
}
//删除收藏
async function delFavorite(node: CfgItem) {
    let cfg = node.cfg;
    if (!("args" in cfg)) {
        return;
    }

    let i = gFavr.cfgbody.items.indexOf(cfg);
    if (i >= 0) {
        gFavr.cfgbody.items.splice(i, 1);
        await saveFavoriteCfgFile(gFavr);
        reload(false);
    }
}

//删除全部收藏
async function delAllFavorite() {
    if (gFavr.cfgbody.items.length === 0) {
        vscode.window.showInformationMessage('收藏为空');
        return;
    }

    if (await vscode.window.showQuickPick(['确定', '取消'], {
        title: '确定删除全部收藏？'
    }) === '确定') {
        gFavr.cfgbody.items.length = 0;
        await saveFavoriteCfgFile(gFavr);
        reload(false);
    }
}
//导出收藏
async function exportFavorite() {
    if (gFavr.cfgbody.items.length === 0) {
        vscode.window.showInformationMessage('收藏为空');
        return;
    }

    let copyFav = Object.assign({ }, gFavr);

    let ts = Date.now().toString().slice(0, -10);

    let fileName = await getInput('分组名称', `收藏夹${ts}`, undefined);

    if (fileName === undefined) {
        vscode.window.showInformationMessage('操作取消');
        return;
    }

    copyFav.cfgbody.dispname = fileName;

    copyFav.filepath = path.join(dataPath.fsPath, 'user', fileName + '.json');

    await saveFavoriteCfgFile(copyFav);

    reload(true);
}

//导入收藏
async function importFavorite(node: CfgItem) {
    let cfg = node.cfg;
    if (!("items" in cfg)) {
        return;
    }

    if (cfg.items.length === 0) {
        vscode.window.showInformationMessage('可收藏项目为空');
        return;
    }

    gFavr.cfgbody.items = gFavr.cfgbody.items.concat(cfg.items);

    await saveFavoriteCfgFile(gFavr);

    reload(false);
}
//显示帮助
function showDoc(node: CfgItem) {
    vscode.window.showInformationMessage(node.document);
}
//修改信息
async function editInfo(node: CfgItem) {
    let cfg = node.cfg;
    if (!("items" in cfg)) {
        return;
    }

    let newName = await getInput('分组名称', cfg.dispname, undefined);
    let newDescribe = await getInput('描述信息', cfg.describe, undefined);

    if (newName !== undefined) {
        cfg.dispname = newName;
    }

    if (newDescribe !== undefined) {
        cfg.describe = newDescribe;
    }

    await saveUserCfgFile(gCfgs);
    reload(true);
}
//插入命令
async function insertItem(node: CfgItem) {
    let cfg = node.cfg;
    if ("value" in cfg || !("doc" in cfg)) {
        return;
    }

    let args: string[] = [];
    let i = 1;

    cfg.args.forEach(arg => {
        let name = arg.name !== "" ? `${arg.name}:` : "";
        args.push(`${name}\${${i++}:${arg.value}}`);
    });

    let cmd = `@${cfg.name}` + (args.length > 0 ? ` ${args.join(' ')}` : "") + '\n';

    vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(cmd));
}
//修改命令
async function editItem(node: CfgItem, isItem: boolean = true) {
    let cfg = node.cfg;
    if (!("args" in cfg)) {
        return;
    }

    let tCfg: FileInfo | undefined = undefined;
    let tItem: ItemObject | undefined = undefined;

    if (isItem) {
        for (let e of gCfgs) {
            for (let f of e.cfgbody.items) {
                if (cfg === f) {
                    tCfg = e;
                    tItem = f;
                    break;
                }
            }
            if (tCfg !== undefined) {
                break;
            }
        }
    } else {
        for (let f of gFavr.cfgbody.items) {
            if (cfg === f) {
                tCfg = gFavr;
                tItem = f;
                break;
            }
        }
    }

    if (tCfg === undefined || tItem === undefined) {
        return;
    }

    tItem.name = await getInput('命令名称(不需要带@)', cfg.name, undefined) || cfg.name;
    tItem.disp = await getInput('显示名称', cfg.disp, undefined) || cfg.disp;
    tItem.doc = await getInput('备注信息', cfg.doc, undefined) || cfg.doc;

    await saveFavoriteCfgFile(tCfg);
    reload(true);
    reload(false);
}
//添加命令
async function addItem(node: CfgItem) {
    let line = vscode.window.activeTextEditor?.selection.active.line;
    if (line === undefined) {
        return;
    }
    let text = vscode.window.activeTextEditor?.document.lineAt(line).text.trim();

    if (text === undefined || text.length === 0) {
        return;
    }

    let groups = text.split(/\s+/g);

    if (groups.length === 0) {
        return;
    }

    let name = groups.shift();

    if (name === undefined) {
        return;
    }

    if (name.startsWith('@')) {
        name = name.substring(1);
    }

    let disp = name;

    let first = true;

    let args: ArgObject[] = [];

    groups.forEach(group => {
        if (first) {
            if (group.indexOf(':') === -1) {
                group = ':' + group;
            }
        }

        let [name, value] = group.split(/:/);

        if (name.length > 0 || first) {
            args.push({ name, disp: name, value, type: ArgType.str, doc: '' });
        }
        first = false;
    });

    gFavr.cfgbody.items.push({ name, disp, args, doc: '' });
    await saveFavoriteCfgFile(gFavr);
    reload(false);
}
//删除命令
async function delItem(node: CfgItem) {
    let cfg = node.cfg;
    if ("value" in cfg || "dispname" in cfg) {
        return;
    }

    for (let e of gCfgs) {
        let i = e.cfgbody.items.indexOf(cfg);
        if (i >= 0) {

            if (await vscode.window.showQuickPick(['确定', '取消'], {
                title: '确定删除该命令？'
            }) === '确定') {
                e.cfgbody.items.splice(i, 1);
                await saveFavoriteCfgFile(e);
                reload(true);
                return;
            }
        }
    }
}
//删除分组
async function delRoot(node: CfgItem) {
    let cfg = node.cfg;
    if (!("dispname" in cfg)) {
        return;
    }

    for (let gCfg of gCfgs) {
        if (gCfg.cfgbody === cfg) {
            if (await vscode.window.showQuickPick(['确定', '取消'], {
                title: '确定删除整组命令？'
            }) === '确定') {
                const uri = vscode.Uri.from({ scheme: 'file', path: gCfg.filepath });
                await vscode.workspace.fs.delete(uri);
                reload(true);
                return;
            }
        }
    }
}
//添加参数
async function addArgv(node: CfgItem, isItem: boolean = true) {
    let cfg = node.cfg;
    if (!("args" in cfg)) {
        return;
    }

    let tCfg: FileInfo | undefined = undefined;
    let tItem: ItemObject | undefined = undefined;

    if (isItem) {
        for (let e of gCfgs) {
            for (let f of e.cfgbody.items) {
                if (cfg === f) {
                    tCfg = e;
                    tItem = f;
                    break;
                }
            }
            if (tCfg !== undefined) {
                break;
            }
        }
    } else {
        for (let f of gFavr.cfgbody.items) {
            if (cfg === f) {
                tCfg = gFavr;
                tItem = f;
                break;
            }
        }
    }

    if (tItem === undefined || tCfg === undefined) {
        return;
    }

    let name = await getInput('参数名称', "", '参数名称') || '';
    let disp = await getInput('显示名称(可空)', "", '显示名称') || '';
    let value = await getInput('参数值', "", '参数值') || '';
    let typeStr = await vscode.window.showQuickPick(['文本', '数字', '布尔', '列表', '空'], { title: '请选择参数类型' }) || '文本';
    let doc = await getInput('参数说明(可空)', "", '参数说明') || '';

    name = name.trim();
    value = value.trim();

    if (tItem.args.length === 0 && name === '') {
        vscode.window.showInformationMessage('参数名称不能为空');
    }
    else {
        tItem.args.push({ name, value, type: str2ArgType(typeStr), disp, doc });
    }

    saveFavoriteCfgFile(tCfg);
    reload(isItem);
}
//编辑参数
async function editArgv(node: CfgItem, isItem: boolean = true) {
    let cfg = node.cfg;
    if (!("value" in cfg)) {
        return;
    }

    let tCfg: FileInfo | undefined = undefined;
    let tArgv: ArgObject | undefined = undefined;

    if (isItem) {
        for (let e of gCfgs) {
            for (let f of e.cfgbody.items) {
                for (let j of f.args) {
                    if (cfg === j) {
                        tCfg = e;
                        tArgv = j;
                        break;
                    }
                }
                if (tCfg !== undefined) {
                    break;
                }
            }
            if (tCfg !== undefined) {
                break;
            }
        }
    } else {
        for (let f of gFavr.cfgbody.items) {
            for (let j of f.args) {
                if (cfg === j) {
                    tCfg = gFavr;
                    tArgv = j;
                    break;
                }
            }
            if (tCfg !== undefined) {
                break;
            }
        }
    }

    if (tCfg === undefined || tArgv === undefined) {
        return;
    }

    tArgv.name = await getInput('参数名称', tArgv.name, '参数名称') || '';
    tArgv.disp = await getInput('显示名称(可空)', tArgv.disp, '显示名称') || '';
    tArgv.value = await getInput('参数值', tArgv.value?.toString() || "", '参数值') || '';
    tArgv.type = str2ArgType(await vscode.window.showQuickPick(['文本', '数字', '布尔', '列表', '空'], { title: '请选择参数类型' }) || '文本');
    tArgv.doc = await getInput('参数说明(可空)', tArgv.disp, '参数说明') || '';

    await saveFavoriteCfgFile(tCfg);
    reload(isItem);
}
//删除参数
async function delArgv(node: CfgItem, isItem: boolean = true) {
    let cfg = node.cfg;
    if (!("value" in cfg)) {
        return;
    }

    let tCfg: FileInfo | undefined = undefined;

    if (isItem) {
        for (let e of gCfgs) {
            for (let f of e.cfgbody.items) {
                let i = f.args.indexOf(cfg);
                if (i >= 0) {
                    f.args.splice(i, 1);
                    tCfg = e;
                    break;
                }
            }
        }
    } else {
        for (let f of gFavr.cfgbody.items) {
            let i = f.args.indexOf(cfg);
            if (i >= 0) {
                f.args.splice(i, 1);
                tCfg = gFavr;
                break;
            }
        }
    }

    if (tCfg !== undefined) {
        await saveFavoriteCfgFile(tCfg);
        reload(isItem);
    }
}