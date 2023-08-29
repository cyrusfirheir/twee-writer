import { Session, StorageKeys } from "./session.ts";

const list = document.getElementById("document-listing") as HTMLElement;
const newDocumentButton = document.getElementById("new-document-button") as HTMLButtonElement;

const sessions: Session[] = [];

for (const key in localStorage) {
	if (key.startsWith(StorageKeys.saved.session)) {
		try {
			const session: Session = JSON.parse(localStorage.getItem(key) ?? "null");
			if (session) {
				sessions.push(session);
			}
		} catch (ex) {
			console.error(ex);
		}
	}
}

sessions
	.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
	.forEach(session => {
		const listItem = document.createElement("li");
		list.appendChild(listItem);

		const item = document.createElement("div");
		item.classList.add("document-listing-item");
		listItem.appendChild(item);

		const link = document.createElement("a");
		link.href = `editor/?session=${session.id}`;
		link.innerHTML = session.editor.filename;
		item.appendChild(link);

		const lastModified = document.createElement("div");
		lastModified.innerHTML = new Date(session.lastModified).toUTCString();
		item.appendChild(lastModified);
	});

const newDocument = () => {
	location.href = `editor/?session=new`;
};

newDocumentButton.addEventListener("click", newDocument);