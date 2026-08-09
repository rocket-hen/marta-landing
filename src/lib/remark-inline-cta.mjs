import { visit } from 'unist-util-visit';

// Turns ":::inline-cta{url=\"...\" label=\"...\"} ... :::" into a CTA box
// matching the post's closing CTA (same .cta-btn styling). Body text becomes
// the copy, the attributes set the button's link and label. Requires
// remark-directive to run first — it parses ":::name{attrs}" into
// containerDirective nodes (with `.attributes`) in the first place.
export default function remarkInlineCta() {
	return (tree) => {
		visit(tree, (node) => {
			if (node.type !== 'containerDirective' || node.name !== 'inline-cta') return;
			const { url, label } = node.attributes ?? {};

			const data = node.data ?? (node.data = {});
			data.hName = 'div';
			data.hProperties = { className: ['inline-cta'] };

			node.children.push({
				type: 'paragraph',
				data: { hProperties: { className: ['inline-cta-action'] } },
				children: [
					{
						type: 'link',
						url: url || '/#pricing',
						data: { hProperties: { className: ['cta-btn'] } },
						children: [{ type: 'text', value: label || 'Sign up' }],
					},
				],
			});
		});
	};
}
