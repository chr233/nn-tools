/*
 * @Author       : Chr_
 * @Date         : 2021-09-01 23:08:14
 * @LastEditors  : Chr_
 * @LastEditTime : 2021-09-02 02:24:55
 * @Description  : 
 */

import * as vscode from 'vscode';
import { ArgType } from './cfgFileHandler';

export async function getInput(title: string, value: string, placeHolder?: string): Promise<string | undefined> {
    let input = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: `请输入 ${title} 的值`,
        placeHolder: placeHolder,
        value: value
    });
    return input;
}

export function str2ArgType(typeStr: string): ArgType {
    switch (typeStr) {
        case '文本':
            return ArgType.str;
        case '数字':
            return ArgType.num;
        case '布尔':
            return ArgType.bool;
        case '列表':
            return ArgType.list;
        default:
            return ArgType.none;
    }
}

export function argType2str(type: ArgType): string {
    switch (type) {
        case ArgType.str:
            return '文本';
        case ArgType.num:
            return '数字';
        case ArgType.bool:
            return '布尔';
        case ArgType.list:
            return '列表';
        default:
            return '空';
    }
}