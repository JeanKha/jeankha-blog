import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export const remarkAbc: Plugin<[], Root> = () => (tree) => {
	visit(tree, "code", (node, index, parent) => {
		if (node.lang !== "abc" || !parent || index === undefined) return;
		parent.children[index] = {
			type: "paragraph",
			data: { hName: "pre", hProperties: { className: ["abc-notation"] } },
			children: [{ type: "text", value: node.value }],
		};
	});
};