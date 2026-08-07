import { visit } from 'unist-util-visit';

// Turns the ":::highlight ... :::" placeholder syntax from the content team's
// checklist into a real HTML block. Requires remark-directive to run first —
// it's what parses ":::name" into containerDirective nodes in the first place.
export default function remarkCallouts() {
	return (tree) => {
		visit(tree, (node) => {
			if (node.type !== 'containerDirective' || node.name !== 'highlight') return;
			const data = node.data ?? (node.data = {});
			data.hName = 'div';
			data.hProperties = { className: ['highlight-block'] };
		});
	};
}