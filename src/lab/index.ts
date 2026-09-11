import "./lab.css";

declare const __LAB_BRANCH__: string;
declare const __LAB_COMMIT__: string;
declare const __LAB_BUILD_TIME__: string;

const LAB_MODE = "READ ONLY" as const;

function setText(id: string, value: string): void {
  const node = document.getElementById(id);
  if (node !== null) node.textContent = value;
}

setText("lab-branch", __LAB_BRANCH__);
setText("lab-commit", __LAB_COMMIT__);
setText("lab-build-time", __LAB_BUILD_TIME__);

document.documentElement.dataset.labMode = LAB_MODE.toLowerCase().replaceAll(" ", "-");
document.documentElement.dataset.labBranch = __LAB_BRANCH__;
document.documentElement.dataset.labCommit = __LAB_COMMIT__;
