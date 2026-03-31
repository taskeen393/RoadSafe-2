const fs = require('fs');
const path = require('path');

const CWD = 'c:\\Users\\ZEE-TECH\\AMT\\mobile';
const APP_DIR = path.join(CWD, 'app');
const dirsToMove = ['api', 'context', 'services', 'utils'];

// Move directories
for (const dir of dirsToMove) {
    const src = path.join(APP_DIR, dir);
    const dest = path.join(CWD, dir);
    if (fs.existsSync(src)) {
        console.log(`Moving ${src} to ${dest}`);
        fs.renameSync(src, dest);
    }
}

// Function to replace imports in a file
function updateImports(filePath, relativeDepthFromRoot) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    const prefix = relativeDepthFromRoot === 0 ? './' : '../'.repeat(relativeDepthFromRoot);

    for (const dir of dirsToMove) {
        // Find imports like from './dir/...' or from '../dir/...'
        // The regex looks for from 'relative_path/dir/...' and we replace the relative_path part with the new correct path.
        // Wait, a better way is to parse.
        // If file was in app/, relativeDepthFromRoot was 0, now it's 0 if we are in app, etc.

        // Actually, just replace `from './dir` and `from '../dir` with the correct root-relative prefix

        // If the file is inside the moved dirs:
        // Before: imported from '../services' (if they were side-by-side in app)
        // Now: imported from '../services' (since they are side-by-side in root)
        // So files inside the moved directories might NOT need import changes for OTHER moved directories!
        // Wait, if it was app/context importing app/services, it used '../services'. 
        // Now it's context importing services, so it's still '../services'.
        // So we might only need to update files that remained in `app` or `components`.
    }
}

// Just doing a simple find-replace
function walkAndReplace(dir, replaceFn) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkAndReplace(fullPath, replaceFn);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = replaceFn(fullPath, content);
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

// Fix imports in app/
walkAndReplace(APP_DIR, (filePath, content) => {
    // files directly in app/ (like app/_layout.tsx)
    const isDirectlyInApp = path.dirname(filePath) === APP_DIR;
    // files one level deep in app/ (like app/Tabs/index.tsx)
    const isOneLevelDeep = path.dirname(path.dirname(filePath)) === APP_DIR;
    const isTwoLevelsDeep = path.dirname(path.dirname(path.dirname(filePath))) === APP_DIR;

    for (const d of dirsToMove) {
        if (isDirectlyInApp) {
            // import from './services' -> import from '../services'
            content = content.replace(new RegExp(`from '\\./${d}`, 'g'), `from '../${d}`);
            content = content.replace(new RegExp(`from "\\./${d}`, 'g'), `from "../${d}`);
        } else if (isOneLevelDeep) {
            // import from '../services' -> import from '../../services'
            content = content.replace(new RegExp(`from '\\.\\./${d}`, 'g'), `from '../../${d}`);
            content = content.replace(new RegExp(`from "\\.\\./${d}`, 'g'), `from "../../${d}`);
        } else if (isTwoLevelsDeep) {
            // import from '../../services' -> import from '../../../services'
            content = content.replace(new RegExp(`from '\\.\\./\\.\\./${d}`, 'g'), `from '../../../${d}`);
            content = content.replace(new RegExp(`from "\\.\\./\\.\\./${d}`, 'g'), `from "../../../${d}`);
        }
    }
    return content;
});

// Fix imports in the moved dirs
for (const d of dirsToMove) {
    const dirPath = path.join(CWD, d);
    walkAndReplace(dirPath, (filePath, content) => {
        // If a moved file imported something from `../components`, it was `app/api/foo` -> `app/../components` = `components`
        // Now it's `api/foo` -> `../components` (still the same!)
        // So imports between moved dirs and root dirs don't change.
        return content;
    });
}

console.log('Done');
