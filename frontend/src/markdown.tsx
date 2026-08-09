import type {Components} from 'react-markdown';

// Converts pasted `<Image src="…" alt="…" caption="…" />` component tags into
// standard Markdown image syntax so they render like any other markdown image.
export function normalizeMarkdown(md: string): string {
    return md.replace(/<Image\b([^>]*)\/?>/gi, (match, rawAttrs: string) => {
        const attrs: Record<string, string> = {};
        const attrPattern = /(\w+)\s*=\s*"([^"]*)"|(\w+)\s*=\s*'([^']*)'/g;
        let m: RegExpExecArray | null;
        while ((m = attrPattern.exec(rawAttrs))) {
            const key = (m[1] ?? m[3]).toLowerCase();
            attrs[key] = m[2] ?? m[4] ?? '';
        }
        if (!attrs.src) return match;
        const image = `![${attrs.alt ?? ''}](${attrs.src})`;
        return attrs.caption ? `${image}\n*${attrs.caption}*` : image;
    });
}

// Images in notes are often remote URLs; decoding off the main thread keeps a slow
// fetch from janking the rest of the page once it finally arrives.
export const markdownComponents: Components = {
    img: (props) => <img {...props} decoding="async" />,
};
