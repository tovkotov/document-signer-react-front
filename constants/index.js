export const CONTRACT_ADDRESS = "0x619c279DF72C57A8D73753d0AD5825c25E07854B";
export const abi = [
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "_documentHash",
                "type": "bytes32"
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