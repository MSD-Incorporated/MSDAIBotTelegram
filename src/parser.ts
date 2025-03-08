export const parser = (str: string) => {
	str = str.replace(/</g, "&lt;").replace(/>/g, "&gt;");

	str = str.replace(/```(.*)\n([\s\S]*?)```/gm, val => {
		const language = val.split(/\s+/)[0]!.slice(3).replace("c#", "csharp").replace("c++", "cpp");

		val = val.replace(
			/```(.*)\n([\s\S]*?)```/gm,
			`<pre><code class="language-${language}">${val.slice(3 + language.length + 1, val.length - 4)}</code></pre>`
		);

		return val;
	});

	return str
		.replace(/^(\s+|)\*(\s+)(.*)*$/gm, val => {
			val = val.replace("*", `<b>${val.indexOf("*") <= 1 ? " " : ""}•</b>`);

			return val;
		})
		.replace(/\#\#(.*)/gm, val => `<b>${val.slice(3)}</b>`)
		.replace(/`([\s\S]*?)`/gm, val => `<code>${val.slice(1, val.length - 1)}</code>`)
		.replace(/\*\*(.*)\*\*/gm, "<b>$1</b>")
		.replace(/\*(.*)\*/gm, "<b>$1</b>");
};
