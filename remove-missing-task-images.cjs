const fs = require("fs");

const file = "src/sections/cv/cv-data.js";
let source = fs.readFileSync(file, "utf8");

source = source.replace(/^\s*image:\s*taskGroupImage\("jestei-ui-ux-strategy\.webp"[\s\S]*?\),\r?\n/gm, "");
source = source.replace(/^\s*image:\s*taskGroupImage\("jestei-design-system\.webp"[\s\S]*?\),\r?\n/gm, "");
source = source.replace(/^\s*image:\s*taskGroupImage\("jestei-design-process\.webp"[\s\S]*?\),\r?\n/gm, "");

const explicitUrlBlock = /const TASK_GROUP_IMAGE_URLS = \{[\s\S]*?\};\r?\n\r?\nconst getTaskGroupImageSrc = \(filename\) => \{\r?\n\s*const normalizedFilename = String\(filename \|\| ""\)\.trim\(\);\r?\n\s*return TASK_GROUP_IMAGE_URLS\[normalizedFilename\] \|\| "";\r?\n\};\r?\n\r?\n/;

const eagerGlobBlock = /const taskGroupImageModules = import\.meta\.glob\([\s\S]*?\);\r?\n\r?\nconst getTaskGroupImageSrc = \(filename\) => \{\r?\n\s*const normalizedFilename = String\(filename \|\| ""\)\.trim\(\);\r?\n\s*const entry = Object\.entries\(taskGroupImageModules\)\.find\(\(\[path\]\) => getFilename\(path\) === normalizedFilename\);\r?\n\s*return entry \? getModuleUrl\(entry\[1\]\) : "";\r?\n\};\r?\n\r?\n/;

const taskGroupImageBlock = /const taskGroupImage = \(filename, alt\) => \(\{\r?\n\s*src: getTaskGroupImageSrc\(filename\),\r?\n\s*alt,\r?\n\}\);\r?\n\r?\n/;

source = source.replace(explicitUrlBlock, "");
source = source.replace(eagerGlobBlock, "");
source = source.replace(taskGroupImageBlock, "");

fs.writeFileSync(file, source, "utf8");
