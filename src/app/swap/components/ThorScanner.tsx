'use client';
import { keystoneApi, walletSlice } from "@/lib/wallet_slice";
import { URType } from "@keystonehq/keystone-sdk";
import { AppShell, Button, Group, Stack } from "@mantine/core";
import { AnimatedQRScanner } from "@keystonehq/animated-qr"
import { Text } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";


export const ThorScanner = () => {
    const dispatch = useDispatch();
    const isScanning = useSelector(walletSlice.selectors.selectIsScanning);
    const scanProgress = useSelector(walletSlice.selectors.selectScanProgress);
    const [processKeystoneScan] = keystoneApi.useProcessKeystoneScanMutation();
    const currentWallet = useSelector(walletSlice.selectors.selectActiveWalletFingerprint);

    const handleScan = async ({ type, cbor }: { type: string, cbor: string }) => {
        try {
            dispatch(walletSlice.actions.setIsScanning(false));
            await processKeystoneScan({ type, cbor });
        } catch (error) {
            console.error('Scan processing failed:', error);
            dispatch(walletSlice.actions.setIsScanning(false));
        }
    };

    return (
        <AppShell padding="md">
            {currentWallet && <Text>Current Wallet: {currentWallet}</Text> || <Text>No wallet selected</Text>}
            {isScanning ? (
                <Stack align="center">
                    <AnimatedQRScanner
                        handleScan={handleScan}
                        handleError={(error) => {
                            console.error(error);
                            dispatch(walletSlice.actions.setIsScanning(false));
                        }}
                        urTypes={Object.values(URType)}
                        onProgress={(progress) =>
                            dispatch(walletSlice.actions.setScanProgress(progress))
                        }
                        options={{ width: 400, height: 300 }}
                    />
                    <Text>Progress: {scanProgress}%</Text>
                </Stack>
            ) : (
                <Group>
                    <Button onClick={() => {
                        dispatch(walletSlice.actions.setIsScanning(true));
                        dispatch(walletSlice.actions.setScanProgress(0));
                    }
                    }>Scan Keystone</Button>
                    <Button onClick={
                        () => {
                            dispatch(walletSlice.actions.setIsScanning(false));
                            dispatch(walletSlice.actions.setScanProgress(0));
                        }
                    }>Reset</Button>
                </Group>
            )}
        </AppShell>
    );
};