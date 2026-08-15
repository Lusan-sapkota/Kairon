import {isValidElement, useMemo, type ReactNode} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type {Components} from 'react-markdown';
import {BookOpen} from 'lucide-react';
import {BrowserOpenURL} from '../../wailsjs/runtime/runtime';
import guideMd from 'virtual:kairon-guide';
import {markdownComponents} from '../markdown';

function flatten(node: ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(flatten).join('');
    if (isValidElement<{children?: ReactNode}>(node) && node.props.children != null) {
        return flatten(node.props.children);
    }
    return '';
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

function headingId(children: ReactNode): string {
    return slugify(flatten(children));
}

function openLink(href: string | undefined) {
    if (!href) return;
    if (href.startsWith('#')) {
        document.getElementById(href.slice(1))?.scrollIntoView({behavior: 'smooth', block: 'start'});
        return;
    }
    BrowserOpenURL(href);
}

const guideComponents: Components = {
    ...markdownComponents,
    h2: ({children}) => <h2 id={headingId(children)}>{children}</h2>,
    h3: ({children}) => <h3 id={headingId(children)}>{children}</h3>,
    a: ({href, children}) => (
        <a
            href={href}
            onClick={(e) => {
                e.preventDefault();
                openLink(href);
            }}
        >
            {children}
        </a>
    ),
};

function guideHeadings(md: string): {id: string; label: string}[] {
    const headings: {id: string; label: string}[] = [];
    for (const match of md.matchAll(/^## (.+)$/gm)) {
        const label = match[1].trim();
        headings.push({id: slugify(label), label});
    }
    return headings;
}

export function GuidePanel() {
    const toc = useMemo(() => guideHeadings(guideMd), []);

    return (
        <section className="settings-card settings-guide-card">
            <div className="settings-guide-chrome">
                <div className="settings-card-head">
                    <span className="settings-card-icon">
                        <BookOpen size={16} />
                    </span>
                    <div>
                        <h3>Guide</h3>
                        <p>Everything in Kairon: views, gestures, shortcuts, and settings.</p>
                    </div>
                </div>
                <div className="settings-guide-toc" aria-label="Guide sections">
                    {toc.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            className="settings-guide-chip"
                            onClick={() => openLink(`#${item.id}`)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="settings-guide-body note-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={guideComponents}>
                    {guideMd}
                </ReactMarkdown>
            </div>
        </section>
    );
}
