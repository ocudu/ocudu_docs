const path = require('path');

module.exports = function linkFilterLoader(source) {
    const filePath = this.resourcePath;

    // Filter out links to non-markdown files (keep only links to .md/.mdx files and directories)
    // This regex matches markdown links: [text](path)
    // Note: This preserves HTML anchor tags like <a id="..."></a> which are used for linking within documents
    const filteredSource = source.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, link) => {

        // Custom exception for files without extension
        if (link === './LICENSE') {
            return text;
        }

        // Keep external links (http://, https://, mailto:, etc.)
        if (/^[a-z]+:/i.test(link)) {
            return match;
        }

        // Keep anchor links (#section)
        if (link.startsWith('#')) {
            return match;
        }

        // Keep links to markdown files
        if (/\.mdx?$/i.test(link)) {
            return match;
        }

        // Keep links to directories (no extension or ends with /)
        if (!path.extname(link) || link.endsWith('/')) {
            return match;
        }

        // Remove link to non-markdown file, keep only the text
        return text;
    });

    return filteredSource;
};
