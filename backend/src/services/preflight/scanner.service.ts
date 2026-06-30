export const parseRepoUrl = (repoUrl: string) => {
  const cleanedUrl = repoUrl.replace(/\.git$/, '');
  const parts = cleanedUrl.split('/');
  const repo = parts.pop() || '';
  const owner = parts.pop() || '';
  return { owner, repo };
};

const getHeaders = () => {
  const headers: Record<string, string> = {
    'User-Agent': 'MicrOps-Preflight-Engine',
  };
  if (process.env.GITHUB_PAT) {
    headers['Authorization'] = `token ${process.env.GITHUB_PAT}`;
  }
  return headers;
};

export const scanRepository = async (repoUrl: string) => {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const fileSet = new Set<string>();
  let defaultBranch = 'main';

  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: getHeaders() });
    if (repoRes.ok) {
      const repoData = await repoRes.json();
      defaultBranch = repoData.default_branch || 'main';
    }

    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers: getHeaders() });
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      if (Array.isArray(treeData.tree)) {
        treeData.tree.forEach((item: any) => fileSet.add(item.path));
      }
    } else {
      const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers: getHeaders() });
      if (contentRes.ok) {
        const contentData = await contentRes.json();
        if (Array.isArray(contentData)) {
          contentData.forEach((item: any) => fileSet.add(item.path));
        }
      }
    }
  } catch (err: any) {
    console.error(`[Scanner] Error fetching repo tree for ${owner}/${repo}:`, err.message);
  }

  return { owner, repo, defaultBranch, fileSet };
};

export const fetchFileContent = async (owner: string, repo: string, filePath: string): Promise<string | null> => {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      headers: getHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
  } catch (err: any) {
    console.error(`[Scanner] Error fetching content for ${filePath}:`, err.message);
  }
  return null;
};
