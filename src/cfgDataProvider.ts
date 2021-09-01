/*
 * @Author       : Chr_
 * @Date         : 2021-08-30 22:08:42
 * @LastEditors  : Chr_
 * @LastEditTime : 2021-09-02 02:25:54
 * @Description  : 树形列表数据处理
 */

import path = require('path');
import * as vscode from 'vscode';
import { TreeDataProvider, TreeItem, TreeItemCollapsibleState, TreeItemLabel, Uri } from 'vscode';

import { FileInfo, CfgObject, ItemObject, ArgObject, ArgType } from './cfgFileHandler';
import { genDocument } from './helpInfo';
import { argType2str } from './utils';

const icoRoot = 'file-open.svg';
const icoItem = 'file-common.svg';
const icoArgv = 'code.svg';

const icos = [icoRoot, icoItem, icoArgv];


export enum NodeType { root, item, argv, favr }


export class CfgItem extends vscode.TreeItem {
	public readonly document: string;

	constructor(
		public readonly cfg: CfgObject | ItemObject | ArgObject,
		public readonly type: NodeType = NodeType.root,
		public children: CfgItem[] = [],
	) {
		super(
			"args" in cfg ? `${cfg.disp} @${cfg.name}` : ("value" in cfg ? `${cfg.disp} @${cfg.name} ${argType2str(cfg.type)}` : cfg.dispname),
			children.length === 0 ? TreeItemCollapsibleState.None : TreeItemCollapsibleState.Collapsed
		);

		if ("value" in cfg) { // argv
			switch (cfg.type) {
				case ArgType.bool:
					this.label += `: ${cfg.value ? "真" : "假"}`;
					break;
				case ArgType.str:
					this.label += `: ${cfg.value || "【空】"}`;
					break;
				default:
					this.label += `: ${cfg.value}`;
			}
			this.contextValue = 'cfgArgv';

		} else if ("doc" in cfg) { // item
			this.contextValue = 'cfgItem';

		} else { // root
			this.contextValue = 'cfgRoot';
		}

		this.tooltip = genDocument(cfg);

		this.document = this.tooltip;

	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', icos[this.type]),
		dark: path.join(__filename, '..', '..', 'resources', icos[this.type])
	};
}


export class UserCfgProvider implements TreeDataProvider<CfgItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData?: vscode.Event<CfgItem | undefined> = this._onDidChangeTreeData.event;

	private data: CfgItem[] = [];

	constructor(cfgs: FileInfo[]) {
		this.refreshItem(cfgs);
	}

	refreshItem(cfgs: FileInfo[]) {
		this.data = [];

		for (const { cfgbody } of cfgs) {
			let items: CfgItem[] = [];
			cfgbody.items.forEach(item => {

				let args: CfgItem[] = [];
				item.args.forEach(arg => {
					args.push(
						new CfgItem(arg, NodeType.argv)
					);
				});

				items.push(
					new CfgItem(item, NodeType.item, args)
				);
			});
			this.data.push(new CfgItem(cfgbody, NodeType.root, items));
		}

		this._onDidChangeTreeData.fire(undefined);
	}


	getTreeItem(element: CfgItem): TreeItem | Thenable<TreeItem> {
		return element;
	}

	getChildren(element?: CfgItem | undefined): vscode.ProviderResult<CfgItem[]> {
		if (element === undefined) {
			return this.data;
		}
		return element.children;
	}
}

export class FavrCfgProvider implements TreeDataProvider<CfgItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData?: vscode.Event<CfgItem | undefined> = this._onDidChangeTreeData.event;

	private data: CfgItem[] = [];

	constructor(cfg: FileInfo) {
		this.refreshItem(cfg);
	}

	refreshItem(cfg: FileInfo) {
		this.data.length = 0;

		cfg.cfgbody.items.forEach(item => {

			let args: CfgItem[] = [];
			item.args.forEach(arg => {
				args.push(
					new CfgItem(arg, NodeType.argv)
				);
			});

			this.data.push(
				new CfgItem(item, NodeType.item, args)
			);
		});
		this._onDidChangeTreeData.fire(undefined);
	}


	getTreeItem(element: CfgItem): TreeItem | Thenable<TreeItem> {
		return element;
	}

	getChildren(element?: CfgItem | undefined): vscode.ProviderResult<CfgItem[]> {
		if (element === undefined) {
			return this.data;
		}
		return element.children;
	}
}