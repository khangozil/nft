"use client";

import { useState, useEffect, useCallback } from "react";

import { useTonConnectUI } from "@tonconnect/ui-react";
import { beginCell, toNano, Address } from "@ton/core";
import TonWeb from "tonweb";
import React from "react";
import Link from "next/link";

import {
  Button,
  Typography,
  Box,
  Snackbar,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Grid as Grid2,
  Card,
  CardMedia,
  CardContent,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import QRCode from "react-qr-code";

interface Jetton {
  name: string;
  symbol: string;
  image: string;
  description: string;
  address: string;
  balance: string;
}

const tonWeb = new TonWeb(
  new TonWeb.HttpProvider("https://testnet.toncenter.com/api/v2/jsonRPC", {
    apiKey: "d60982a0aa833c5a62a1627b7e50360817c4bc7bbfcf23b42e00cebefe070298",
  })
);

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Home() {
  const [tonConnectUI] = useTonConnectUI();
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [jettons, setJettons] = useState<Jetton[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(
    null
  );
  const [nfts, setNfts] = useState<any[]>([]); // State for NFTs
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [amountTON, setAmountTON] = useState<number | string>("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [isTransactionSuccessful, setIsTransactionSuccessful] = useState<
    boolean | null
  >(null);

  const handleWalletConnection = useCallback((address: string) => {
    setTonWalletAddress(address);
    console.log("Wallet connected successfully!");
    setIsLoading(false);
    fetchWalletBalance(address);
    fetchJettonsWallet(address);
  }, []);

  // const destinationAddress = Address.parse(
  //   "0QDQ5qRgcWZEJFh156txDtBbuRKGDp-BSLDhvU0A6RLrP20s"
  // );

  // const forwardPayload = beginCell()
  //   .storeUint(0, 32)
  //   .storeStringTail("Hello , TON")
  //   .endCell();

  // const body = beginCell()
  //   .storeUint(0xf8a7ea5, 32) // opcode chuyển Jetton (theo tài liệu của TON)
  //   .storeUint(0, 64) // query_id (id của giao dịch, có thể là số ngẫu nhiên)
  //   .storeCoins(toNano("5")) // Số lượng Jetton (9 chữ số thập phân)
  //   .storeAddress(destinationAddress) // Địa chỉ ví nhận
  //   .storeAddress(
  //     Address.parse(
  //       "0:0000000000000000000000000000000000000000000000000000000000000000"
  //     )
  //   ) // Địa chỉ trả lời (0 nếu không cần thiết)
  //   .storeBit(0) // Không sử dụng custom_payload
  //   .storeCoins(toNano("0.02")) // Phí giao dịch hoặc phí bổ sung nếu có
  //   .storeBit(1) // Forward payload lưu trữ dạng tham chiếu
  //   .storeRef(forwardPayload) // Đưa forwardPayload vào
  //   .endCell();
  // const jettonWalletContract = Address.parse(
  //   "kQD45xXMo3FN3sBhLYPDyEHD8br9SfOpBVTDgMisKh5kg2PG"
  // );

  // const myTransaction = {
  //   validUntil: Math.floor(Date.now() / 1000) + 360, // Giao dịch hết hạn sau 360 giây
  //   messages: [
  //     {
  //       address: jettonWalletContract.toString(), // Địa chỉ ví Jetton
  //       amount: toNano("0.05").toString(), // Phí giao dịch (phí mạng)
  //       payload: body.toBoc().toString("base64"), // Payload giao dịch (được mã hóa base64)
  //     },
  //   ],
  // };

  // // Hàm gửi giao dịch
  // const sendJettonTransaction = async () => {
  //   try {
  //     await tonConnectUI.sendTransaction(myTransaction);
  //     alert("Transaction sent successfully!");
  //   } catch (error) {
  //     console.error("Transaction failed:", error);
  //     alert("Transaction failed. Check console for details.");
  //   }
  // };

  // Fetch NFTs by Address
  const fetchNFTByAddress = async (walletAddress: string) => {
    console.log("Fetching NFTs for wallet address:", walletAddress);

    try {
      const response = await fetch(
        `https://testnet.tonapi.io/v2/accounts/${walletAddress}/nfts`
      );

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Full response data:", data);

        // Ensure we check for the correct key 'nft_items'
        if (data?.nft_items?.length > 0) {
          const nftList = data.nft_items.map((nft: any) => ({
            name: nft.metadata?.name || "Unknown",
            symbol: nft.metadata?.symbol || "N/A",
            image: nft.metadata?.image || "",
            description: nft.metadata?.description || "No description",
          }));

          console.log("NFTs successfully parsed:", nftList);
          setNfts(nftList);
        } else {
          console.log("No NFTs found for this wallet.");
          setNfts([]); // Clear NFTs in case the wallet has none
        }
      } else {
        console.error("Error response when fetching NFTs.");
      }
    } catch (error) {
      console.error("An error occurred during fetch:", error);
    }
  };

  useEffect(() => {
    if (tonWalletAddress) {
      fetchWalletBalance(tonWalletAddress);
      fetchJettonsWallet(tonWalletAddress);
      fetchNFTByAddress(tonWalletAddress); // Fetch NFTs
    }
  }, [tonWalletAddress]);

  const handleWalletDisconnection = useCallback(async () => {
    if (tonConnectUI.connected) {
      await tonConnectUI.disconnect();
      setTonWalletAddress(null);
      setWalletBalance(null);
      setTransactionHash(null);
      console.log("Wallet disconnected successfully!");
      setIsLoading(false);
    } else {
      console.log("Wallet is not connected, no action taken.");
    }
  }, [tonConnectUI]);

  const fetchWalletBalance = async (address: string) => {
    try {
      const walletAddress = new TonWeb.utils.Address(address);
      const balance = await tonWeb.getBalance(walletAddress);
      const balanceInTON = Number(balance) / 1e9;
      setWalletBalance(balanceInTON);
    } catch (error) {
      console.error("Failed to retrieve balance:", error);
    }
  };

  const fetchJettonsWallet = async (walletAddress: string) => {
    try {
      const response = await fetch(
        `https://testnet.tonapi.io/v2/accounts/${walletAddress}/jettons`
      );
      const data = await response.json();

      if (data.balances && Array.isArray(data.balances)) {
        const jettonList = data.balances.map((jetton: any) => ({
          name: jetton.jetton.name || "Unknown Jetton",
          symbol: jetton.jetton.symbol || "N/A",
          balance: (Number(jetton.balance) / 1e9).toFixed(2),
          image: jetton.jetton.image || "",
          address: jetton.jetton.address || "",
        }));

        setJettons(jettonList);
      } else {
        console.error("No jettons found in wallet.");
      }
    } catch (error) {
      console.error("Failed to fetch jettons in wallet:", error);
    }
  };

  // load so du 5s
  useEffect(() => {
    const interval = setInterval(() => {
      if (tonWalletAddress) {
        fetchWalletBalance(tonWalletAddress);
        fetchJettonsWallet(tonWalletAddress);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [tonWalletAddress]);

  const handleCopyAddress = () => {
    if (tonWalletAddress) {
      navigator.clipboard.writeText(tonWalletAddress);
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (tonConnectUI.account?.address) {
        handleWalletConnection(tonConnectUI.account?.address);
      } else {
        handleWalletDisconnection();
      }
      try {
      } finally {
        setIsLoading(false);
      }
    };

    checkWalletConnection();

    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        handleWalletConnection(wallet.account.address);
      } else {
        handleWalletDisconnection();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tonConnectUI, handleWalletConnection, handleWalletDisconnection]);

  const handleWalletAction = async () => {
    if (tonConnectUI.connected) {
      setIsLoading(true);
      await handleWalletDisconnection();
    } else {
      await tonConnectUI.openModal();
    }
  };

  const transferWithHashRetrieval = async () => {
    const amount = parseFloat(amountTON as string);
    if (!recipientAddress || isNaN(amount)) {
      setTransactionStatus("Invalid input");
      return;
    }

    const amountInNanoTON = TonWeb.utils.toNano(amount.toString());
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: recipientAddress,
          amount: amountInNanoTON.toString(),
          payload: "",
        },
      ],
    };

    try {
      const response = await tonConnectUI.sendTransaction(transaction);
      console.log("Transaction response:", response);

      setTransactionStatus("Transaction in progress...");

      // Add a slight delay before fetching the transaction hash
      setTimeout(() => {
        fetchTransactionHash();
      }, 5000); // Adjust the delay as necessary
    } catch (error) {
      console.error("Failed to execute TON transfer:", error);
      setTransactionStatus("Transaction failed.");
      setIsTransactionSuccessful(false);
    }
  };

  const fetchTransactionHash = async (retries = 5, delay = 2000) => {
    try {
      const url = `https://testnet.toncenter.com/api/v2/getTransactions?address=${tonWalletAddress}&limit=1&api_key=d60982a0aa833c5a62a1627b7e50360817c4bc7bbfcf23b42e00cebefe070298`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.result.length > 0) {
        const hash = data.result[0].transaction_id.hash;
        setTransactionHash(hash);
        setTransactionStatus("Transaction successful!");
        setIsTransactionSuccessful(true);
      } else {
        if (retries > 0) {
          console.log(`Retrying... (${retries} attempts left)`);
          setTimeout(() => fetchTransactionHash(retries - 1, delay), delay);
        } else {
          setTransactionStatus(
            "Transaction completed, but hash could not be retrieved."
          );
          setIsTransactionSuccessful(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch transaction hash:", error);
      setTransactionStatus(
        "Transaction successful, but hash retrieval failed."
      );
      setIsTransactionSuccessful(false);
    }
  };

  const formatAddress = (address: string) => {
    try {
      const tonAddress = new TonWeb.utils.Address(address);
      // false for non-bounceable
      const friendlyAddress = tonAddress.toString(true, true, false, true); // base64,...,Bounceable=true, testnet=true
      return `${friendlyAddress.slice(0, 4)}...${friendlyAddress.slice(-4)}`;
    } catch (error) {
      console.error("Invalid address format:", error);
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
  };

  const handleShowQRCode = () => {
    setShowQRCode((prev) => !prev);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen">
      {/* Header Section */}
      <Box
        component="header"
        sx={{
          width: "100%",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #ddd",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          NFT Marketplace
        </Typography>

        {/* Wallet Action */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleWalletAction}
          disabled={isLoading}
        >
          {tonWalletAddress ? "Disconnect Wallet" : "Connect Wallet"}
        </Button>
      </Box>

      {/* Main Content Area */}
      {tonWalletAddress ? (
        // Wallet is connected — show full marketplace
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            height: "calc(100vh - 64px)",
          }}
        >
          {/* Left Side - NFTs Section */}
          <Box
            sx={{
              flex: 1,
              backgroundColor: "#f0f0f0",
              padding: "20px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              overflowY: "auto",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Your NFTs
            </Typography>

            {nfts.length > 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                {nfts.map((nft, index) => (
                  <Box
                    key={index}
                    sx={{
                      flex: "1 1 calc(33.333% - 16px)", // Responsive design: 3 items per row
                      maxWidth: "calc(33.333% - 16px)",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      borderRadius: "8px",
                    }}
                  >
                    <Card>
                      <CardMedia
                        component="img"
                        height="200"
                        image={nft.image}
                        alt={nft.name}
                        sx={{
                          objectFit: "cover",
                        }}
                      />
                      <CardContent>
                        <Typography gutterBottom variant="h6" component="div">
                          {nft.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {nft.description || "No description available"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography>No NFTs in Wallet.</Typography>
            )}
          </Box>

          {/* Right Side - Wallet & Jettons Info Section */}
          <Box
            sx={{
              flex: 1,
              backgroundColor: "#ffffff",
              padding: "20px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              overflowY: "auto",
            }}
          >
            {/* Wallet Information */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Wallet Information
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Wallet Address:</strong> {formatAddress(tonWalletAddress)}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Wallet Balance:</strong> {walletBalance} TON
            </Typography>

            {/* Jetton List */}
            <Typography variant="h6" sx={{ mt: 3 }}>
              Your Jettons
            </Typography>
            {jettons.length > 0 ? (
              <List>
                {jettons.map((jetton, index) => (
                  <ListItem key={index}>
                    <img
                      src={jetton.image}
                      alt={jetton.name}
                      style={{
                        width: 40,
                        height: 40,
                        marginRight: 10,
                      }}
                    />
                    <ListItemText
                      primary={`${jetton.name} (${jetton.symbol})`}
                      secondary={`Balance: ${jetton.balance}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No Jettons in Wallet.</Typography>
            )}

            {/* Transfer Section */}
            <Typography variant="h6" sx={{ mt: 3 }}>
              Transfer TON
            </Typography>
            <TextField
              label="Recipient Address"
              variant="outlined"
              fullWidth
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              margin="normal"
            />
            <TextField
              label="Amount in TON"
              variant="outlined"
              fullWidth
              type="number"
              value={amountTON}
              onChange={(e) => setAmountTON(e.target.value)}
              margin="normal"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={transferWithHashRetrieval}
              style={{ marginTop: "10px" }}
            >
              Transfer TON
            </Button>
          </Box>
        </Box>
      ) : (
        // Wallet is NOT connected — show only centered message
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "calc(100vh - 64px)",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: "linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)",
              fontWeight: "bold",
              transition: "transform 0.3s ease, color 0.3s ease",
              "&:hover": {
                transform: "scale(1.1)",
                color: "#ff9800",
              },
            }}
          >
            Welcome to NFTs Marketplace
          </Typography>
        </Box>
      )}
    </main>
  );
}
