const axios = require('axios');

class CloudflareService {
    constructor() {
        this.baseURL = 'https://api.cloudflare.com/client/v4';
    }

    getHeaders(apiToken) {
        return {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        };
    }

    async validateToken(apiToken) {
        try {
            const response = await axios.get(`${this.baseURL}/user`, {
                headers: this.getHeaders(apiToken)
            });

            if (response.data.success) {
                return {
                    success: true,
                    email: response.data.result.email,
                    id: response.data.result.id
                };
            }
            return { success: false, error: 'Invalid token' };
        } catch (error) {
            console.error('Token validation error:', error.response?.data || error.message);
            return { 
                success: false, 
                error: error.response?.data?.errors?.[0]?.message || 'Token validation failed' 
            };
        }
    }

    async listWorkers(apiToken, accountId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/accounts/${accountId}/workers/scripts`,
                { headers: this.getHeaders(apiToken) }
            );

            if (response.data.success) {
                return {
                    success: true,
                    workers: response.data.result || []
                };
            }
            return { success: false, error: 'Failed to fetch workers' };
        } catch (error) {
            console.error('List workers error:', error.response?.data || error.message);
            return { 
                success: false, 
                error: error.response?.data?.errors?.[0]?.message || 'Failed to list workers' 
            };
        }
    }

    async deployWorker(apiToken, accountId, workerName, scriptContent) {
        try {
            const response = await axios.put(
                `${this.baseURL}/accounts/${accountId}/workers/scripts/${workerName}`,
                scriptContent,
                {
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/javascript'
                    }
                }
            );

            if (response.data.success) {
                return {
                    success: true,
                    worker: response.data.result
                };
            }
            return { success: false, error: 'Deploy failed' };
        } catch (error) {
            console.error('Deploy worker error:', error.response?.data || error.message);
            return { 
                success: false, 
                error: error.response?.data?.errors?.[0]?.message || 'Deploy failed' 
            };
        }
    }

    async deleteWorker(apiToken, accountId, workerName) {
        try {
            const response = await axios.delete(
                `${this.baseURL}/accounts/${accountId}/workers/scripts/${workerName}`,
                { headers: this.getHeaders(apiToken) }
            );

            if (response.data.success) {
                return { success: true };
            }
            return { success: false, error: 'Delete failed' };
        } catch (error) {
            console.error('Delete worker error:', error.response?.data || error.message);
            return { 
                success: false, 
                error: error.response?.data?.errors?.[0]?.message || 'Delete failed' 
            };
        }
    }

    async getWorkerSubdomain(apiToken, accountId, zoneId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/accounts/${accountId}/workers/subdomain`,
                { headers: this.getHeaders(apiToken) }
            );

            if (response.data.success && response.data.result) {
                return response.data.result.subdomain;
            }
            
            // Fallback: try to get from zone info
            const zoneResponse = await axios.get(
                `${this.baseURL}/zones/${zoneId}`,
                { headers: this.getHeaders(apiToken) }
            );

            if (zoneResponse.data.success) {
                const zoneName = zoneResponse.data.result.name;
                return zoneName.replace('.', '-');
            }

            return 'workers';
        } catch (error) {
            console.error('Get subdomain error:', error.response?.data || error.message);
            return 'workers';
        }
    }
}

module.exports = new CloudflareService();