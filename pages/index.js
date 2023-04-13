import React, {useEffect, useRef, useState} from "react";
import Web3Modal from "web3modal";
import {ethers} from "ethers";
import {abi, CONTRACT_ADDRESS} from "/constants/index.js";
import 'bootstrap/dist/css/bootstrap.min.css';
import CryptoJS from "crypto-js";
import {Dropbox} from "dropbox";

function App() {
    const [walletConnected, setWalletConnected] = useState(false);
    const web3ModalRef = useRef();
    const [file, setFile] = useState(null);
    const [documentHash, setDocumentHash] = useState(null);
    const [signersInput, setSignersInput] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [fileUrl, setFileUrl] = useState("");
    const [signersInputDisabled, setSignersInputDisabled] = useState(true);
    const [isFileInBlockchain, setIsFileInBlockchain] = useState(false);
    const [disableSaveButton, setDisableSaveButton] = useState(true);
    const [accessToken, setAccessToken] = useState('');
    const [dropboxAccessToken, setDropboxAccessToken] = useState(null);

    // const dropboxClient = new Dropbox({accessToken: dropboxAccessToken});

    useEffect(() => {
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: 97,
                providerOptions: {},
                disableInjectedProvider: false,
            });
        }
    }, [walletConnected]);

    useEffect(() => {
        if (isFileInBlockchain !== null && documentHash) {
            setDisableSaveButton(isFileInBlockchain);
        }
    }, [isFileInBlockchain, documentHash]);


    const connectWallet = async () => {
        try {
            const provider = await web3ModalRef.current.connect();
            const web3Provider = new ethers.providers.Web3Provider(provider);
            setWalletConnected(true);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (file) {
            calculateDocumentHash(file).then(async (hash) => {
                setDocumentHash(hash);
                await getSignersStatus();
            });
        }
    }, [file]);

    const handleDropboxAuth = () => {
        const dropboxAuthUrl = 'https://www.dropbox.com/oauth2/authorize';
        const clientId = process.env.NEXT_PUBLIC_DROPBOX_CLIENT_ID;
        const redirectUri = process.env.NEXT_PUBLIC_DROPBOX_CALLBACK_URL;

        const authUrl = `${dropboxAuthUrl}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;

        window.location.href = authUrl;
    };

    const handleDropboxOAuthResponse = async () => {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");

        if (code) {
            try {
                const response = await fetch("/api/dropboxAuth?code=" + encodeURIComponent(code));
                const data = await response.json();

                if (data.error) {
                    console.log("-----")
                    console.log(data);
                    console.error("Упс: ", data.error, data.error_description);
                } else {
                    console.log("===")
                    setDropboxAccessToken(data.access_token);
                }
            } catch (error) {
                console.error("Ошибка при обработке ответа Dropbox OAuth:", error);
                console.error("Подробности об ошибке:", error.message, error.stack);
            }
        }
    };

    useEffect(() => {
        (async () => {
            await handleDropboxOAuthResponse();
        })();
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];

        if (file) {
            try {
                setFile(file);
                const fileReader = new FileReader();
                fileReader.onloadend = async () => {
                    const fileBuffer = fileReader.result;
                    const path = `/${file.name}`;
                    const response = await dropboxClient.filesUpload({path, contents: fileBuffer});
                    const sharedLink = await dropboxClient.sharingCreateSharedLinkWithSettings({path: response.result.path_lower});
                    setFileUrl(sharedLink.result.url);
                    console.log("Файл успешно загружен на Dropbox:", sharedLink.result.url);
                };
                fileReader.readAsArrayBuffer(file);

                const hash = await calculateDocumentHash(file);
                setDocumentHash(hash);

                const provider = new ethers.providers.Web3Provider(await web3ModalRef.current.connect());
                const signer = provider.getSigner();
                const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

                const documentHashBytes = ethers.utils.arrayify("0x" + hash);
                const [signers, signedStatus] = await contract.getSignersStatus(documentHashBytes);

                if (signers.length > 0) {
                    setSignersInput(signers.join(', '));
                    setSignersInputDisabled(true);

                    const signersStatus = signers.map((signer, index) => {
                        return `${signer}: ${signedStatus[index] ? "Подписан" : "Не подписан"}`;
                    });
                    setStatusMessage(`Статус подписантов:\n${signersStatus.join("\n")}`);
                } else {
                    setSignersInput('');
                    setSignersInputDisabled(false);
                    setStatusMessage('');
                }
            } catch (error) {
                console.error("Ошибка при загрузке файла на Dropbox или проверке блокчейна:", error);
            }
        }
    };

    const handleSignersInputChange = (e) => {
        setSignersInput(e.target.value);
    };

    const calculateDocumentHash = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const arrayBuffer = event.target.result;
                const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
                const hash = CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
                resolve(hash);
            };
            reader.onerror = (error) => {
                reject(error);
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const saveDocument = async () => {
        if (!documentHash || !signersInput) {
            setStatusMessage("Ошибка: заполните все поля.");
            return;
        }

        try {
            const provider = await web3ModalRef.current.connect();
            const signer = new ethers.providers.Web3Provider(provider).getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
            const signersArray = signersInput.split(",").map((address) => address.trim());
            const documentHashBytes = ethers.utils.arrayify("0x" + documentHash);
            await contract.addDocument(documentHashBytes, signersArray);
            console.log("Документ успешно добавлен.");
            setStatusMessage("Документ успешно добавлен.");
        } catch (error) {
            console.error("Ошибка при добавлении документа:", error);
            setStatusMessage("Ошибка при добавлении документа");
        }
    };

    const signDocument = async () => {
        if (!documentHash) {
            setStatusMessage("Пожалуйста, загрузите файл для вычисления хеша.");
            return;
        }

        try {
            const provider = await web3ModalRef.current.connect();
            const signer = new ethers.providers.Web3Provider(provider).getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
            // Преобразование строки хеша в массив байтов
            const documentHashBytes = ethers.utils.arrayify("0x" + documentHash);
            await contract.signDocument(documentHashBytes);
            setStatusMessage("Документ успешно подписан.");
        } catch (error) {
            console.error("Ошибка при подписании документа:", error);
            setStatusMessage("Ошибка при подписании документа.");
        }
    };

    const getSignersStatus = async () => {
        if (!documentHash) {
            setStatusMessage("Пожалуйста, загрузите файл для вычисления хеша.");
            return;
        }

        try {
            const provider = new ethers.providers.Web3Provider(await web3ModalRef.current.connect());
            const signer = provider.getSigner(); // Получаем signer из provider
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer); // Используем signer вместо provider

            // Преобразование строки хеша в массив байтов
            const documentHashBytes = ethers.utils.arrayify("0x" + documentHash);

            const [signers, signedStatus] = await contract.getSignersStatus(documentHashBytes);
            console.log("Список подписантов:", signers);
            console.log("Статус подписи:", signedStatus);

            const signersStatus = signers.map((signer, index) => {
                return `${signer}: ${signedStatus[index] ? "Подписан" : "Не подписан"}`;
            });
            setStatusMessage(`Статус подписантов:\n${signersStatus.join("\n")}`);
            if (signers.length > 0) {
                setIsFileInBlockchain(true);
            } else {
                setIsFileInBlockchain(false);
            }
        } catch (error) {
            console.error("Ошибка при получении статуса подписантов:", error);
            setStatusMessage("Ошибка при получении статуса подписантов.");
        }
    };

    return (
        <div className="container">
            <h1 className="my-4 text-center">Document Signer</h1>
            <div>
                <button className="btn btn-primary custom-button"
                        onClick={handleDropboxAuth}>
                    Авторизовать Dropbox
                </button>
            </div>
            {!walletConnected && (
                <button
                    className="btn btn-primary custom-button"
                    onClick={connectWallet}
                >
                    Подключить кошелек
                </button>
            )}
            {walletConnected && (
                <div className="card custom-card">
                    <div className="card-body">
                        <div className="mb-3">
                            <label className="form-label">Выберите файл</label>
                            <input
                                className="form-control"
                                type="file"
                                onChange={handleFileChange}
                            />
                            <p>Хеш файла: {documentHash}</p>
                            {fileUrl && (
                                <p>
                                    Ссылка на файл в Dropbox:{" "}
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                        {fileUrl}
                                    </a>
                                </p>
                            )}

                        </div>
                        <div className="mb-3">
                            <label className="form-label">
                                Введите адреса подписантов, разделенные запятыми
                            </label>
                            <input
                                className="form-control"
                                type="text"
                                value={signersInput}
                                onChange={handleSignersInputChange}
                                placeholder="Введите адреса подписантов, разделенные запятыми"
                                disabled={!isFileInBlockchain && !documentHash}
                            />
                        </div>
                        <button
                            className="btn btn-primary custom-button me-2"
                            onClick={saveDocument}
                            disabled={disableSaveButton}
                        >
                            Сохранить
                        </button>
                        <button
                            className="btn btn-primary custom-button me-2"
                            onClick={signDocument}
                        >
                            Подписать документ
                        </button>
                        <p className="mt-3">{statusMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;