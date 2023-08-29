import { LanguageId } from "./editor/register";

export const StorageKeys = {
	editor: {
		value: "editor.value",
		lang: "editor.lang",
		filename: "editor.filename",
		saveEnabled: "editor.save-enabled"
	},
	session: {
		id: "session.id",
		lastModified: "session.last-modified"
	},
	saved: {
		session: "saved.session"
	}
};

export interface Session {
	id: string;
	editor: {
		lang: LanguageId | null;
		value: string | null;
		filename: string;
		saveEnabled: boolean;
	}
	lastModified: Date;
};