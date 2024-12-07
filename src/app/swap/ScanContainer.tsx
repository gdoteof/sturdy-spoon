'use client';
import { ThorScanner } from '@/app/swap/components/ThorScanner';
import { RootState } from '@/lib/store';
import { walletSlice } from '@/lib/wallet_slice';
import { Box, Divider, Text } from '@mantine/core';
 import { connect } from 'react-redux';
interface SwapPageProps {
  scanProgress: number;
  activeFingerprint: string | null;
}

const mapStateToProps = (state: RootState): SwapPageProps => ({
  scanProgress: walletSlice.selectors.selectScanProgress(state),
  activeFingerprint: walletSlice.selectors.selectActiveWalletFingerprint(state),
});
function ScanContainerRaw(props: SwapPageProps) {
    return (
      <Box>
        <Text>Scan Progress {props.scanProgress}</Text>
        <Divider />
        <Text>Active Wallet: {props.activeFingerprint}</Text>
        <ThorScanner />
      </Box>
    );
}
const ScanContainer = connect(mapStateToProps)(ScanContainerRaw);

export default ScanContainer;