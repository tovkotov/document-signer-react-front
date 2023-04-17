import React, {useEffect, useRef, useState} from "react";
import Web3Modal from "web3modal";
import {ethers} from "ethers";
import {abi, CONTRACT_ADDRESS} from "/constants/index.js";
import 'bootstrap/dist/css/bootstrap.min.css';
import CryptoJS from "crypto-js";
import {Dropbox} from "dropbox";
import {useRouter} from 'next/router';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faFileSignature} from '@fortawesome/free-solid-svg-icons';

function App() {
    const [walletConnected, setWalletConnected] = useState(false);
    const web3ModalRef = useRef();
    const [file, setFile] = useState(null);
    const [documentHash, setDocumentHash] = useState(null);
    const [signersInput, setSignersInput] = useState("");
    const [signer, setSigner] = useState(null);
    const [statusMessage, setStatusMessage] = useState("");
    const [fileUrl, setFileUrl] = useState(null);
    const [signersInputDisabled, setSignersInputDisabled] = useState(true);
    const [isFileInBlockchain, setIsFileInBlockchain] = useState(false);
    const [disableSaveButton, setDisableSaveButton] = useState(true);
    const [dropboxAccessToken, setDropboxAccessToken] = useState(null);
    const [dropboxClient, setDropboxClient] = useState(null);
    const [isDropboxAuthorized, setIsDropboxAuthorized] = useState(false);
    const [unsignedDocuments, setUnsignedDocuments] = useState([]);
    const [signedDocuments, setSignedDocuments] = useState([]);
    const router = useRouter();

    useEffect(() => {
        if (dropboxAccessToken) {
            console.log("newDropboxClient create");
            const newDropboxClient = new Dropbox({accessToken: dropboxAccessToken});
            setDropboxClient(newDropboxClient);
        } else {
            setDropboxClient(null);
        }
    }, [dropboxAccessToken]);

    useEffect(() => {
        const {code} = router.query;
        if (code) {
            fetch(`/api/dropboxAuth?code=${code}`)
                .then((response) => response.json())
                .then((data) => {
                    if (data.error) {
                        console.error("Ошибка:", data.error);
                    } else {
                        console.log("Access Token:", data.accessToken);
                        setDropboxAccessToken(data.accessToken);
                    }
                    router.push("/");
                })
                .catch((error) => {
                    console.error("Произошла ошибка:", error);
                    router.push("/");
                });
        }
    }, [router]);

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
            if (!web3ModalRef.current.cachedProvider) {
                await web3ModalRef.current.connect();
            }

            const provider = await web3ModalRef.current.connect();
            const signer = new ethers.providers.Web3Provider(provider).getSigner();
            setSigner(signer);
            setWalletConnected(true);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (signer) {
            fetchUnsignedDocuments(signer);
            fetchSignedDocuments(signer);
        }
    }, [signer]);

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
        window.location.href = `${dropboxAuthUrl}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
    };

    const restoreDropboxSession = () => {
        const savedToken = localStorage.getItem("dropboxAccessToken");
        if (savedToken) {
            setDropboxAccessToken(savedToken);
            setIsDropboxAuthorized(true);
        }
    };

    const handleDropboxOAuthResponse = async () => {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");
        if (code) {
            try {
                const response = await fetch("/api/dropboxAuth?code=" + encodeURIComponent(code));
                const data = await response.json();

                if (data.error) {
                    console.error("Упс: ", data.error, data.error_description);
                } else {
                    setDropboxAccessToken(data.accessToken);
                    localStorage.setItem("dropboxAccessToken", data.accessToken);
                    setIsDropboxAuthorized(true);
                }
            } catch (error) {
                console.error("Ошибка при обработке ответа Dropbox OAuth:", error);
            }
        }
    };

    useEffect(() => {
        handleDropboxOAuthResponse();
    }, []);

    const uploadFileToDropbox = async (file) => {
        if (!dropboxClient) {
            console.error("dropboxClient не инициализирован");
            return;
        }

        return new Promise(async (resolve, reject) => {
            if (file && dropboxClient) {
                const fileReader = new FileReader();
                fileReader.onloadend = async () => {
                    const fileBuffer = fileReader.result;
                    const path = `/${file.name}`;
                    console.log("Загрузка файла на Dropbox с данными:", {path, fileBuffer});
                    try {
                        const response = await dropboxClient.filesUpload({path, contents: fileBuffer});
                        const sharedLink = await dropboxClient.sharingCreateSharedLinkWithSettings({path: response.result.path_lower});
                        setFileUrl(sharedLink.result.url);
                        console.log("Файл успешно загружен на Dropbox:", sharedLink.result.url);
                        resolve(sharedLink.result.url);
                    } catch (error) {
                        console.error("Ошибка при загрузке файла на Dropbox:", error);
                        reject(error);
                    }
                };
                fileReader.readAsArrayBuffer(file);
            } else {
                console.error("Файл не выбран или dropboxClient не инициализирован");
                reject(new Error("Файл не выбран или dropboxClient не инициализирован"));
            }
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];

        if (file) {
            try {
                const hash = await calculateDocumentHash(file);
                setDocumentHash(hash);
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
                setFile(file);
            } catch (error) {
                console.error("Ошибка при загрузке файла на Dropbox или проверке блокчейна:", error);
            }
        }
    };

    const handleSignersInputChange = (e) => {
        setSignersInput(e.target.value);
    };

    const calculateDocumentHash = (file) => {
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

    const fetchDropboxUrl = async (documentHash, signer) => {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        const documentHashBytes = ethers.utils.arrayify(documentHash);
        const dropboxUrl = await contract.getDocumentDropboxUrl(documentHashBytes);
        return dropboxUrl;
    };

    const fetchUnsignedDocuments = async (signer) => {
        if (!signer) {
            return;
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        const unsignedDocs = await contract.getUnsignedDocuments(await signer.getAddress());
        const unsignedDocsWithUrls = [];

        for (const documentHash of unsignedDocs) {
            const dropboxUrl = await fetchDropboxUrl(documentHash, signer);
            unsignedDocsWithUrls.push({documentHash, dropboxUrl});
        }
        setUnsignedDocuments(unsignedDocsWithUrls);
    };

    const fetchSignedDocuments = async (signer) => {
        if (!signer) {
            return;
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
        const signedDocs = await contract.getSignedDocuments(await signer.getAddress());
        const signedDocsWithUrls = [];
        for (const documentHash of signedDocs) {
            const dropboxUrl = await fetchDropboxUrl(documentHash, signer);
            signedDocsWithUrls.push({documentHash, dropboxUrl});
        }
        setSignedDocuments(signedDocsWithUrls);
    };

    const saveDocument = async () => {
        if (!documentHash || !signersInput) {
            setStatusMessage("Ошибка: заполните все поля.");
            return;
        }

        try {
            const uploadedFileUrl = await uploadFileToDropbox(file);
            if (uploadedFileUrl) {
                const provider = await web3ModalRef.current.connect();
                const signer = new ethers.providers.Web3Provider(provider).getSigner();
                const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
                const signersArray = signersInput.split(",").map((address) => address.trim());
                const documentHashBytes = ethers.utils.arrayify("0x" + documentHash);
                const tx = await contract.addDocument(documentHashBytes, uploadedFileUrl, signersArray);
                await tx.wait(5);
                setDisableSaveButton(true);
                await fetchUnsignedDocuments(signer);
                await fetchSignedDocuments(signer);
                setStatusMessage("Документ успешно добавлен.");
            } else {
                console.log("Документ еще не загружен в dropbox");
            }
        } catch (error) {
            console.error("Ошибка при добавлении документа:", error);
            setStatusMessage("Ошибка при добавлении документа");
        }
    };

    const signUploadDocument = async (documentHashToSign) => {
        if (!documentHashToSign) {
            setStatusMessage("Пожалуйста, загрузите файл для вычисления хеша.");
            return;
        }
        try {
            const provider = await web3ModalRef.current.connect();
            const signer = new ethers.providers.Web3Provider(provider).getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
            const documentHashBytes = ethers.utils.arrayify(documentHashToSign);
            const tx = await contract.signDocument(documentHashBytes);
            await tx.wait(5);
            await fetchUnsignedDocuments(signer);
            await fetchSignedDocuments(signer);
            setStatusMessage("Документ успешно подписан.");
        } catch (error) {
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
            const signer = provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
            const documentHashBytes = ethers.utils.arrayify("0x" + documentHash);
            const [signers, signedStatus] = await contract.getSignersStatus(documentHashBytes);
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
            setStatusMessage("Ошибка при получении статуса подписантов.");
        }
    };

    return (
        <div className="container">
            <div className="my-4 text-center d-flex justify-content-center">
                <img src="/logo.png" alt="Логотип" style={{height: '240px', marginRight: '20px'}}/>
            </div>
            <div className="my-4 text-center">
                <h1 className="d-inline align-middle">Document Signer</h1>
            </div>
            {!walletConnected && !isDropboxAuthorized && (
                <div className="my-4 text-center">
                    <p>
                        Document Signer - это приложение для подписи и хранения документов с использованием
                        смарт-контрактов на блокчейне Ethereum и интеграции с Dropbox. Авторизуйтесь через Dropbox и
                        подключите кошелек для начала работы.
                    </p>
                </div>
            )}
            <div className="row">
                {!isDropboxAuthorized && (
                    <div className="text-center">
                        <button className="btn btn-primary custom-button" onClick={handleDropboxAuth}>
                            Авторизовать Dropbox
                        </button>
                    </div>
                )}
                {!walletConnected && (
                    <div className="text-center mt-2">
                        <button className="btn btn-primary custom-button" onClick={connectWallet}>
                            Подключить кошелек
                        </button>
                    </div>
                )}
            </div>
            {walletConnected && (
                <>
                    {/* Верхняя часть страницы: Неподписанные документы */}
                    <div className="card bg-light mb-4">
                        <div className="card-body">
                            <h4>Неподписанные документы</h4>
                            <ul>
                                {unsignedDocuments.map(({documentHash, dropboxUrl}) => (
                                    <li key={documentHash}>
                                        {documentHash} -{" "}
                                        <a href={dropboxUrl} target="_blank" rel="noopener noreferrer">
                                            Просмотреть документ
                                        </a>{" "}
                                        <button
                                            className="btn btn-primary custom-button me-2"
                                            onClick={() => signUploadDocument(documentHash)}
                                        >
                                            <FontAwesomeIcon icon={faFileSignature} className="me-2"/>
                                            Подписать документ
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Средняя часть страницы: Загрузка, сохранение и подписание документов */}
                    <div className="card bg-light mb-4">
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


                            <p className="mt-3">{statusMessage}</p>
                        </div>
                    </div>

                    {/* Нижняя часть страницы: Подписанные документы */}
                    <div className="card bg-light mb-4">
                        <div className="card-body">
                            <h4>Подписанные документы</h4>
                            <ul>
                                {signedDocuments.map(({documentHash, dropboxUrl}) => (
                                    <li key={documentHash}>
                                        {documentHash} -{" "}
                                        <a href={dropboxUrl} target="_blank" rel="noopener noreferrer">
                                            Просмотреть документ
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

}

export default App;