import { visit } from 'unist-util-visit';

// Turns ":::inline-cta{title=\"...\" url=\"...\" label=\"...\"} ... :::" into a
// CTA box: the directive body becomes the copy (full width), and a bottom row
// holds a bold title (left, same styling as the post's closing CTA title) and
// a button (right, same .cta-btn styling). Requires remark-directive to run
// first — it parses ":::name{attrs}" into containerDirective nodes (with
// `.attributes`) in the first place.
export default function remarkInlineCta() {
	return (tree) => {
		visit(tree, (node) => {
			if (node.type !== 'containerDirective' || node.name !== 'inline-cta') return;
			const { title, url, label } = node.attributes ?? {};

			const data = node.data ?? (node.data = {});
			data.hName = 'div';
			data.hProperties = { className: ['inline-cta'] };

			node.children.push({
				type: 'paragraph',
				data: { hName: 'div', hProperties: { className: ['inline-cta-bottom'] } },
				children: [
					{
						type: 'strong',
						data: { hName: 'div', hProperties: { className: ['inline-cta-title'] } },
						children: [{ type: 'text', value: title || '' }],
					},
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
