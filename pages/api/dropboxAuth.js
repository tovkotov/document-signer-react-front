import { Dropbox } from 'dropbox';

export default async function handler(req, res) {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'Missing code parameter' });
    }

    const dropbox = new Dropbox({
        clientId: process.env.NEXT_PUBLIC_DROPBOX_CLIENT_ID,
        clientSecret: process.env.DROPBOX_CLIENT_SECRET,
    });

    try {
        const { result } = await dropbox.auth.getAccessTokenFromCode(
            process.env.NEXT_PUBLIC_DROPBOX_CALLBACK_URL,
            code
        );
        const accessToken = result.access_token;
        res.status(200).json({ success: true, accessToken });
    } catch (error) {
        // Добавьте здесь логирование ошибки, чтобы увидеть подробную информацию
        console.error('Error fetching access token:', error);
        res.status(400).json({ error: 'Error fetching access token', errorDetails: error.message });
    }
}
