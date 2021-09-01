/*
 * @Author       : Chr_
 * @Date         : 2021-09-01 12:24:59
 * @LastEditors  : Chr_
 * @LastEditTime : 2021-09-01 14:43:50
 * @Description  : 帮助信息生成
 */

import { ArgObject, ArgType, CfgObject, ItemObject } from "./cfgFileHandler";

function type2String(type: ArgType): string {
    switch (type) {
        case ArgType.bool:
            return "布尔";
        case ArgType.str:
            return "文本";
        case ArgType.num:
            return "数字";
        case ArgType.list:
            return "列表";
        default:
            return "无";
    }
}

export function genDocument(cfg: CfgObject | ItemObject | ArgObject): string {
    if ("author" in cfg) { //CfgObject

        let itemSummary;
        if (cfg.items.length > 0) {
            itemSummary = cfg.items.slice(0, 5).map(item => ` - ${item.disp} (${item.name})`).join('\n') + '\n...';
        } else {
            itemSummary = '空';
        }

        let document = [
            `名称：${cfg.dispname}`,
            `描述：${cfg.describe}`,
            `包含项目：\n${itemSummary}`
        ].join('\n\n');

        return document;
    }
    else if (!("type" in cfg)) { //ItemObject
        let argvSummary;
        if (cfg.args.length > 0) {
            argvSummary = cfg.args.map(
                arg => ` - ${arg.disp} (${arg.name}) : ${type2String(arg.type)} `
            ).join('\n');
        } else {
            argvSummary = '空';
        }

        let document = [
            `名称：${cfg.disp} (${cfg.name})`,
            `描述：${cfg.doc}`,
            `参数：\n${argvSummary}`
        ].join('\n\n');

        return document;
    } else {//ArgObject
        let document = [
            `参数名：${cfg.disp} (${cfg.name})`,
            `类型：${type2String(cfg.type)}`,
            `参数值：${cfg.value}`,
            `描述：${cfg.doc}`,
        ].join('\n\n');

        return document;
    }
}

export function genExDocument(cfg: CfgObject | ItemObject | ArgObject): string {
    if ("author" in cfg) { //CfgObject

        let itemSummary;
        if (cfg.items.length > 0) {
            itemSummary = cfg.items.slice(0, 5).map(item => ` - ${item.disp} (${item.name})`).join('\n') + '\n...';
        } else {
            itemSummary = '空';
        }

        let document = [
            `名称：${cfg.dispname}`,
            `作者：${cfg.author}`,
            `版本：${cfg.version}`,
            `描述：${cfg.describe}`,
            `包含项目：\n${itemSummary}`
        ].join('\n\n');

        return document;
    }
    else if (!("type" in cfg)) { //ItemObject
        let argvSummary;
        if (cfg.args.length > 0) {
            argvSummary = cfg.args.map(
                arg => ` - ${arg.disp} (${arg.name}) : ${type2String(arg.type)} `
            ).join('\n');
        } else {
            argvSummary = '空';
        }

        let document = [
            `名称：${cfg.disp} (${cfg.name})`,
            `描述：${cfg.doc}`,
            `参数：\n${argvSummary}`
        ].join('\n\n');

        return document;
    } else {//ArgObject
        let document = [
            `参数名：${cfg.disp} (${cfg.name})`,
            `类型：${type2String(cfg.type)}`,
            `参数值：${cfg.value}`,
            `描述：${cfg.doc}`,
        ].join('\n\n');

        return document;
    }
}
