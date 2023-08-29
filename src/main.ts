import { v4 as uuid } from "uuid";
import sanitize from "sanitize-filename";

import { changeLanguage, initEditor } from "./editor";
import { Timer, timestamp } from "./utils/time-utils";
import { downloadFile } from "./utils/file-download";
import { Session, StorageKeys } from "./session";

(async () => {
	const params = new URLSearchParams(location.search);

	let session: Session;

	let sessionID = params.get("session"); 
	if (sessionID === "new") {
		sessionStorage.clear();
		params.delete("session");
	} else if (sessionID) {
		try {
			session = JSON.parse(
				localStorage.getItem(`${StorageKeys.saved.session}.${sessionID}`) ?? "null"
			);
		} catch (ex) {
			console.error(ex);
		}
	}

	session ??= {
		id: sessionStorage.getItem(StorageKeys.session.id) ?? params.get("session") ?? uuid(),
		editor: {
			lang: sessionStorage.getItem(StorageKeys.editor.lang),
			value: sessionStorage.getItem(StorageKeys.editor.value),
			filename: sessionStorage.getItem(StorageKeys.editor.filename) ?? "Untitled Document",
			saveEnabled: !!sessionStorage.getItem(StorageKeys.editor.saveEnabled) ?? false
		},
		lastModified: new Date(sessionStorage.getItem(StorageKeys.session.lastModified) ?? Date.now())
	};

	sessionStorage.setItem(StorageKeys.session.id, session.id);

	if (!params.has("session")) {
		params.set("session", session.id);
		params.sort();
		location.search = params.toString();
	}

	const sessionSaveID = `${StorageKeys.saved.session}.${session.id}`;

	const formatSelectContainer = document.getElementById("format-select-container") as HTMLDivElement;
	const formatSelect = document.getElementById("format-select") as HTMLSelectElement;
	const setAsDefaultButton = document.getElementById("set-as-default-button") as HTMLButtonElement;
	const savingIndicator = document.getElementById("saving-indicator") as HTMLDivElement;
	const editorContainer = document.getElementById("editor-container") as HTMLDivElement;
	const filenameInput = document.getElementById("filename-input") as HTMLInputElement;
	const downloadButton = document.getElementById("download-button") as HTMLButtonElement;
	const saveEnabledCheckboxContainer = document.getElementById("save-enabled-container") as HTMLLabelElement;
	const saveEnabledCheckbox = document.getElementById("save-enabled") as HTMLInputElement;

	const paramLang = params.get("lang");
	if (paramLang) {
		session.editor.lang ??= paramLang;
	}
	session.editor.lang ??= localStorage.getItem(StorageKeys.editor.lang) ?? "sugarcube-2";
	formatSelect.value = session.editor.lang;
	formatSelectContainer.classList.remove("--hidden");

	const paramUri = params.get("uri");
	if (paramUri) {
		try {
			const resource = await fetch(paramUri);
			session.editor.value ??= await resource.text();
		} catch (ex) {
			console.error(ex);
		}
	}
	editorContainer.classList.remove("--loading");

	let editor = await initEditor(editorContainer, session.editor.lang, session.editor.value ?? "");

	const saveTimer = new Timer(() => {
		session.editor.value = editor.getValue();
		session.lastModified = new Date();

		sessionStorage.setItem(StorageKeys.editor.value, session.editor.value);
		if (session.editor.saveEnabled) {
			localStorage.setItem(sessionSaveID, JSON.stringify(session));
		} else {
			localStorage.removeItem(sessionSaveID);
		}

		savingIndicator.classList.remove("--dirty");
		savingIndicator.innerHTML = "All changes saved!";
	}, 500);

	const stateChangeHandler = () => {
		savingIndicator.classList.add("--dirty");
		savingIndicator.innerHTML = "Saving...";
		saveTimer.reset().resume();
	};

	editor.onDidChangeModelContent(stateChangeHandler);

	formatSelect.addEventListener("change", async () => {
		session.editor.lang = formatSelect.value;
		sessionStorage.setItem(StorageKeys.editor.lang, session.editor.lang);
		changeLanguage(editor, session.editor.lang);
		stateChangeHandler();
	});

	setAsDefaultButton.addEventListener("click", () => {
		localStorage.setItem(StorageKeys.editor.lang, formatSelect.value);
	});

	filenameInput.value = session.editor.filename;

	const setDocumentTitle = () => {
		const filename = session.editor.filename;
		document.title = filename.length ? `${filename}.tw - Twee Writer` : "Twee Writer";
	}
	setDocumentTitle();

	filenameInput.addEventListener("input", () => {
		session.editor.filename = sanitize(filenameInput.value.trim()) || timestamp();
		sessionStorage.setItem(StorageKeys.editor.filename, session.editor.filename);
		setDocumentTitle();
		stateChangeHandler();
	});

	const downloadText = () => {
		const file = new File([editor.getValue()], `${session.editor.filename}.tw`, { type: "text/plain" });
		downloadFile(file);
	};

	downloadButton.addEventListener("click", downloadText);

	document.addEventListener("keydown", (ev) => {
		if (ev.key === "s" && ev.ctrlKey) {
			downloadText();
			ev.preventDefault();
		}
	});

	saveEnabledCheckbox.checked = session.editor.saveEnabled;
	const saveEnabledUpdate = () => {
		session.editor.saveEnabled = saveEnabledCheckbox.checked;
		saveEnabledCheckboxContainer.classList.toggle("--checked", session.editor.saveEnabled);
		savingIndicator.classList.toggle("--hidden", !session.editor.saveEnabled);
	};
	saveEnabledUpdate();

	saveEnabledCheckbox.addEventListener("change", () => {
		saveEnabledUpdate();

		if (session.editor.saveEnabled) {
			sessionStorage.setItem(StorageKeys.editor.saveEnabled, "true");
		} else {
			sessionStorage.removeItem(StorageKeys.editor.saveEnabled);
		}
		
		stateChangeHandler();
	});
})();