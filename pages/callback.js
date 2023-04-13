import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
    const router = useRouter();

    useEffect(() => {
        const { code } = router.query;
        if (code) {
            fetch(`/api/dropboxAuth?code=${code}`)
                .then((response) => response.json())
                .then((data) => {
                    if (data.error) {
                        console.error('Ошибка:', data.error);
                    } else {
                        // Обработка полученного access_token
                        console.log('Access Token:', data.accessToken);
                    }
                    router.push('/');
                })
                .catch((error) => {
                    console.error('Произошла ошибка:', error);
                    router.push('/');
                });
        } else {
            router.push('/');
        }
    }, [router]);

    return <div>Обработка авторизации...</div>;
}
