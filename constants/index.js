export const CONTRACT_ADDRESS = "0x30Cb2a2bdc049183E1b5b016eEC18993cc4c05B8";
export const abi = [
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_documentHash",
                "type": "bytes32"
            },
            {
                "internalType": "string",
                "name": "_dropboxUrl",
                "type": "string"
            },
            {
                "internalType": "address[]",
                "name": "_signers",
                "type": "address[]"
            }
        ],
        "name": "addDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "documentHashes",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "documents",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "documentHash",
                "type": "bytes32"
            },
            {
                "internalType": "string",
                "name": "dropboxUrl",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_documentHash",
                "type": "bytes32"
            }
        ],
        "name": "getDocumentDropboxUrl",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_signer",
                "type": "address"
            }
        ],
        "name": "getSignedDocuments",
        "outputs": [
            {
                "internalType": "bytes32[]",
                "name": "",
                "type": "bytes32[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_documentHash",
                "type": "bytes32"
            }
        ],
        "name": "getSignersStatus",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            },
            {
                "internalType": "bool[]",
                "name": "",
                "type": "bool[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_signer",
                "type": "address"
            }
        ],
        "name": "getUnsignedDocuments",
        "outputs": [
            {
                "internalType": "bytes32[]",
                "name": "",
                "type": "bytes32[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_documentHash",
                "type": "bytes32"
            }
        ],
        "name": "signDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];