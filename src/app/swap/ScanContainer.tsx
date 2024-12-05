'use client';
import { AddressTable } from '@/app/swap/components/addressTable';
import { ThorScanner } from '@/app/swap/components/ThorScanner';
import { RootState } from '@/lib/store';
import { CoinAccount, Wallet, walletSlice, WalletState } from '@/lib/wallet_slice';
import { thorApi, thorSlice } from '@/lib/thor_slice';
import { ActionIcon, ActionIconGroup, Box, CheckIcon, Divider, List, Space, Table, Text, Title } from '@mantine/core';
import { PoolDetail } from '@xchainjs/xchain-midgard';
import { LiquidityPosition } from '@xchainjs/xchain-thorchain-query'; import { connect, useSelector } from 'react-redux';
import { uiSlice } from '@/lib/ui_slice';
interface SwapPageProps {
  wallet: Wallet | null;
  scanProgress: number;
  numWallets: number;
  activeFingerprint: string | null;
  liquidityPositions: LiquidityPosition[];
  watchlist: string[] | undefined;
  coinAccounts: CoinAccount[];
  availableFingerprints: string[];
}

const mapStateToProps = (state: RootState): SwapPageProps => ({
  wallet: walletSlice.selectors.selectWalletWithoutEmptyAccounts(state),
  scanProgress: walletSlice.selectors.selectScanProgress(state),
  numWallets: walletSlice.selectors.selectNumWallets(state),
  activeFingerprint: walletSlice.selectors.selectActiveWalletFingerprint(state),
  liquidityPositions: thorSlice.selectors.selectLiquidityPositions(state),
  watchlist: walletSlice.selectors.selectFirstAndNonZeroAddresses(state),
  coinAccounts: walletSlice.selectors.selectCoinAccountsWithKnownAddresses(state),
  availableFingerprints: walletSlice.selectors.selectWalletFingerPrints(state),
});
function PageRaw(props: SwapPageProps) {
  const { wallet } = props;
  const serverBootstrapped = useSelector(uiSlice.selectors.getServerStoreBootstrapped);
    return (
      <Box>
        <Text>Scan Progress {props.scanProgress}</Text>
        <Divider />
        <Text>Number of wallets: {props.numWallets} | {props.coinAccounts.map((account,index)=>
          <span key={`${account.chain}-${index}`}>{account.chain} {account.derivedAddresses.length}</span>
        )}</Text>
        <Text>Number of wallets: {props.numWallets} | {props.watchlist?.join(", ") ?? "n/a"}</Text>
        <Space />
        <Text>Liquidity Positions: {props.liquidityPositions.length}</Text>
        <Divider />
        <Text>Active Wallet: {props.activeFingerprint}</Text>
        <List>
          <List.Item>
            {props.watchlist?.map((address, index) => (
              <Text key={index}>{address}</Text>
            ))}
          </List.Item>
        </List>
        <Divider />
        <ThorScanner />
        {wallet === null && <Text>{props.availableFingerprints.join(
          ', '
        )}</Text>}
        {wallet && (
          <Box>
            <Title>Wallet {wallet.masterFingerprint}</Title>
            <Text>Wallet Type: {wallet.walletType}</Text>
          </Box>
        )}
        {serverBootstrapped && props.liquidityPositions.map((position, index) => (
          <Box key={index}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Underlying Asset</Table.Th>
                  <Table.Th>Asset Deposit</Table.Th>
                  <Table.Th>Rune</Table.Th>
                  <Table.Th>Units</Table.Th>
                  <Table.Th>Asset Pool Share</Table.Th>
                  <Table.Th>Rune Pool Share</Table.Th>
                  <Table.Th>Pool Address</Table.Th>
                  <Table.Th>Pending Rune</Table.Th>
                  <Table.Th>Pending Asset</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td>{position.position.asset}</Table.Td>
                  <Table.Td>{position.position.asset_deposit_value}</Table.Td>
                  <Table.Td>{position.position.rune_deposit_value}</Table.Td>
                  <Table.Td>{position.position.units}</Table.Td>
                  <Table.Td>{position.poolShare.assetShare.assetAmountFixedString()}</Table.Td>
                  <Table.Td>{position.poolShare.runeShare.assetAmountFixedString()}</Table.Td>
                  <Table.Td>{position.position.asset_address}</Table.Td>
                  <Table.Td>{position.position.pending_rune}</Table.Td>
                  <Table.Td>{position.position.pending_asset}</Table.Td>
                  <Table.Td>
                    <Text>Actions</Text>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
            <Divider />
          </Box>
        ))}
      </Box>
    );
}
const ScanContainer = connect(mapStateToProps)(PageRaw);

export default ScanContainer;