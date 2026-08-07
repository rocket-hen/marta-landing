import { visit } from 'unist-util-visit';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC_BLOG_DIR = fileURLToPath(new URL('../../public/blog/', import.meta.url));

// Turns "::img[description]" markers (from the content checklist) into real
// <img> tags. The bracket text is only a search hint used to source the photo —
// it isn't rendered. Requires remark-directive to run first, and a
// public/blog/<slug>/images.json manifest (one entry per marker, in order) —
// posts without a manifest are left untouched.
export default function remarkInlineImages() {
	return (tree, file) => {
		const slug = path.basename(file.stem ?? path.basename(file.path, path.extname(file.path)));
		const manifestPath = path.join(PUBLIC_BLOG_DIR, slug, 'images.json');
		if (!existsSync(manifestPath)) return;
		const images = JSON.parse(readFileSync(manifestPath, 'utf-8'));

		let i = 0;
		visit(tree, (node) => {
			if (node.type !== 'leafDirective' || node.name !== 'img') return;
			const img = images[i++];
			if (!img) return;

			const data = node.data ?? (node.data = {});
			data.hName = 'img';
			data.hProperties = {
				src: `/blog/${slug}/${img.file}`,
				srcset: img.fileSmall ? `/blog/${slug}/${img.fileSmall} 800w, /blog/${slug}/${img.file} ${img.width}w` : undefined,
				sizes: img.fileSmall ? '(max-width: 640px) 100vw, 720px' : undefined,
				alt: img.alt,
				width: img.width,
				height: img.height,
				loading: 'lazy',
				decoding: 'async',
				className: ['inline-img'],
			};
			node.children = [];
		});
	};
}
