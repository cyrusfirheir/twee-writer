import type { LanguageId } from './register';
import type { ScopeName, TextMateGrammar, ScopeNameInfo } from './providers';

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { createOnigScanner, createOnigString, loadWASM } from 'vscode-oniguruma';
import { SimpleLanguageInfoProvider } from './providers';
import { registerLanguages } from './register';
import { rehydrateRegexps } from './configuration';
import { theme, colors } from './themes/material-theme-palenight-high-contrast';

interface DemoScopeNameInfo extends ScopeNameInfo {
	path: string;
}

export async function initEditor(element: HTMLElement, language: LanguageId, value = "") {
	const languages: monaco.languages.ILanguageExtensionPoint[] = [
		{ id: "javascript" },
		{ id: "css" },
		{ id: "chapbook-1" },
		{ id: "sugarcube-2" },
		{ id: "harlowe-3" },
	];
	const grammars: { [scopeName: string]: DemoScopeNameInfo } = {
		"source.chapbook-1.twee3": {
			language: "chapbook-1",
			path: "chapbook-1.json"
		},
		"source.sugarcube-2.twee3": {
			language: "sugarcube-2",
			path: "sugarcube-2.json"
		},
		"source.harlowe-3.twee3": {
			language: "harlowe-3",
			path: "harlowe-3.json"
		},
		"source.js": {
			language: "JavaScript",
			path: "javascript.json"
		},
		"source.css": {
			language: "CSS",
			path: "css.json"
		}
	};

	const fetchGrammar = async (scopeName: ScopeName): Promise<TextMateGrammar> => {
		const { path } = grammars[scopeName];
		const uri = `../grammars/${path}`;
		const response = await fetch(uri);
		const grammar = await response.text();
		const type = path.endsWith('.json') ? 'json' : 'plist';
		return { type, grammar };
	};

	const fetchConfiguration = async (
		language: LanguageId,
	): Promise<monaco.languages.LanguageConfiguration> => {
		const uri = `../configurations/${language}.json`;
		const response = await fetch(uri);
		const rawConfiguration = await response.text();
		return rehydrateRegexps(rawConfiguration);
	};

	const data: ArrayBuffer | Response = await loadVSCodeOnigurumWASM();
	loadWASM(data);
	const onigLib = Promise.resolve({
		createOnigScanner,
		createOnigString,
	});

	const provider = new SimpleLanguageInfoProvider({
		grammars,
		fetchGrammar,
		configurations: languages.map((language) => language.id),
		fetchConfiguration,
		theme,
		onigLib,
		monaco
	});
	registerLanguages(
		languages,
		(language: LanguageId) => provider.fetchLanguageInfo(language),
		monaco,
	);

	monaco.editor.defineTheme("Material-Theme", {
		base: "vs-dark",
		rules: [{ token: "" }],
		inherit: true,
		colors
	});

	const editor = monaco.editor.create(element, {
		value,
		language,
		theme: 'Material-Theme',
		minimap: {
			enabled: true,
			renderCharacters: false,
		},
		useTabStops: true,
		tabSize: 4,
		insertSpaces: false
	});

	provider.injectCSS();

	window.addEventListener("resize", function() {
		editor.layout();
	});

	return editor;
}

export function changeLanguage (editor: monaco.editor.IStandaloneCodeEditor, language: LanguageId) {
	const model = editor.getModel();
	if (model) monaco.editor.setModelLanguage(model, language);
};

async function loadVSCodeOnigurumWASM(): Promise<Response | ArrayBuffer> {
	const response = await fetch('../onig.wasm');
	const contentType = response.headers.get('content-type');
	if (contentType === 'application/wasm') {
		return response;
	}

	return await response.arrayBuffer();
}