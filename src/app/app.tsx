'use client';
import '@mysten/dapp-kit/dist/index.css';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


import ListPools from "@/app/components/Pools/ListPools";
import { AppDispatch, RootState } from "@/lib/store";
import { uiSlice } from "@/lib/ui_slice";
import { AppShell, Box, Container, Group, Skeleton } from "@mantine/core";

import { Burger } from "@mantine/core";
import { ConnectButton } from "@mysten/dapp-kit";
import { connect } from "react-redux";

interface AppProps {
  opened: boolean;
  toggle: () => void;
}


const mapStateToProps = (state: RootState) => ({
  opened: state.ui.menuOpen,
})
const queryClient = new QueryClient();
const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};
const mapDispatchToProps = (dispatch: AppDispatch) => ({
  toggle: () => dispatch(uiSlice.actions.toggleMenu()),
})
export const AppRaw = (props: AppProps) => {
  const { opened, toggle } = props;

  return (<AppShell
    header={{ height: 60 }}
    navbar={{
      width: 300, breakpoint: 'sm', collapsed: {
        desktop: !opened,
        mobile: !opened,
      }
    }}
    padding="md"
  >
    <AppShell.Header>
      <Container className={'w-full flex justify-between p-2'}>
        <Burger
          opened={opened}
          onClick={toggle}
          className={''}
          size="sm"
        />
        <Box className={''} visibleFrom="sm">
          <Group gap={0} justify="flex-end" className={''}>
            <div> 1 </div>
            <div> 2 </div>
            </Group>
        </Box>
        <Box>
          <ConnectButton />
        </Box>
      </Container>
    </AppShell.Header>
    <AppShell.Navbar p="md">
      Navbar
      {Array(15)
        .fill(0)
        .map((_, index) => (
          <Skeleton key={index} h={28} mt="sm" animate={false} />
        ))}
    </AppShell.Navbar>
    <AppShell.Main>
      <ListPools />
    </AppShell.Main>
  </AppShell>
  );
}

const AppConnected = connect(mapStateToProps, mapDispatchToProps)(AppRaw);

const App = () =>
  <QueryClientProvider client={queryClient}>
    <SuiClientProvider networks={networks} defaultNetwork="devnet">
      <WalletProvider>
        <AppConnected />
      </WalletProvider>
    </SuiClientProvider>
  </QueryClientProvider>

export default App;