const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');

class GitHubService {
    constructor() {
        this.tempDir = path.join(__dirname, '../temp');
        fs.ensureDirSync(this.tempDir);
    }

    async cloneRepository(repoUrl, workerName) {
        const repoPath = path.join(this.tempDir, `${workerName}_${Date.now()}`);
        
        try {
            // Clean URL and ensure it's a valid GitHub URL
            const cleanUrl = this.cleanGitHubUrl(repoUrl);
            
            console.log(`Cloning repository: ${cleanUrl} to ${repoPath}`);
            
            const git = simpleGit();
            await git.clone(cleanUrl, repoPath);
            
            return {
                success: true,
                path: repoPath
            };
        } catch (error) {
            console.error('Clone error:', error);
            
            // Clean up on error
            if (fs.existsSync(repoPath)) {
                await fs.remove(repoPath);
            }
            
            return {
                success: false,
                error: error.message || 'Failed to clone repository'
            };
        }
    }

    cleanGitHubUrl(url) {
        // Remove any trailing slashes and ensure proper format
        let cleanUrl = url.trim().replace(/\/$/, '');
        
        // If it's a github.com URL without .git, add it
        if (cleanUrl.includes('github.com') && !cleanUrl.endsWith('.git')) {
            cleanUrl += '.git';
        }
        
        // Handle different GitHub URL formats
        if (cleanUrl.startsWith('https://github.com/')) {
            return cleanUrl;
        } else if (cleanUrl.startsWith('github.com/')) {
            return `https://${cleanUrl}`;
        } else if (cleanUrl.match(/^[\w-]+\/[\w-]+$/)) {
            // Format: username/repo
            return `https://github.com/${cleanUrl}.git`;
        }
        
        return cleanUrl;
    }

    async checkWranglerConfig(repoPath) {
        const wranglerPath = path.join(repoPath, 'wrangler.toml');
        
        try {
            if (await fs.pathExists(wranglerPath)) {
                const content = await fs.readFile(wranglerPath, 'utf8');
                return {
                    exists: true,
                    content: content,
                    path: wranglerPath
                };
            }
            
            return { exists: false };
        } catch (error) {
            console.error('Error checking wrangler.toml:', error);
            return { exists: false };
        }
    }

    async findMainScript(repoPath) {
        const possibleFiles = [
            'index.js',
            'worker.js',
            'src/index.js',
            'src/worker.js',
            'dist/index.js',
            'build/index.js'
        ];

        for (const file of possibleFiles) {
            const filePath = path.join(repoPath, file);
            if (await fs.pathExists(filePath)) {
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    return {
                        found: true,
                        path: filePath,
                        content: content,
                        relativePath: file
                    };
                } catch (error) {
                    console.error(`Error reading ${file}:`, error);
                }
            }
        }

        return { found: false };
    }

    async readPackageJson(repoPath) {
        const packagePath = path.join(repoPath, 'package.json');
        
        try {
            if (await fs.pathExists(packagePath)) {
                const content = await fs.readJson(packagePath);
                return {
                    exists: true,
                    content: content
                };
            }
            
            return { exists: false };
        } catch (error) {
            console.error('Error reading package.json:', error);
            return { exists: false };
        }
    }

    async cleanup(repoPath) {
        try {
            if (fs.existsSync(repoPath)) {
                await fs.remove(repoPath);
                console.log(`Cleaned up temp directory: ${repoPath}`);
            }
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }

    async cleanupOldTempDirs() {
        try {
            const files = await fs.readdir(this.tempDir);
            const now = Date.now();
            const maxAge = 60 * 60 * 1000; // 1 hour

            for (const file of files) {
                const filePath = path.join(this.tempDir, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtimeMs > maxAge) {
                    await fs.remove(filePath);
                    console.log(`Cleaned up old temp directory: ${filePath}`);
                }
            }
        } catch (error) {
            console.error('Error cleaning up old temp directories:', error);
        }
    }
}

module.exports = new GitHubService();