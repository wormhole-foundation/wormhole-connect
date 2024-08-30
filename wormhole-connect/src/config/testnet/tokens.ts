import { Icon, TokensConfig } from '../types';

export const TESTNET_TOKENS: TokensConfig = {
  ETH: {
    key: 'ETH',
    symbol: 'ETH',
    nativeChain: 'sepolia',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETH',
  },
  WETH: {
    key: 'WETH',
    symbol: 'WETH',
    nativeChain: 'sepolia',
    icon: Icon.ETH,
    tokenId: {
      chain: 'sepolia',
      address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    },
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      mumbai: {
        address: '0xc6735cc74553Cc2caeB9F5e1Ea0A4dAe12ef4632',
        decimals: 18,
      },
      bsc: {
        address: '0x064a85eac6b4Bd7190BCAd3458dBD9459989c37B',
        decimals: 18,
      },
      fuji: {
        address: '0xbB5A2dC896Ec4E2fa77F40FA630582ed9c6D0172',
        decimals: 18,
      },
      fantom: {
        address: '0x758FEebDDeC06f4bCcEc8F756C8efBD35d5b7124',
        decimals: 18,
      },
      alfajores: {
        address: '0x898471a82737dFFfB61915F9e8381e279076D72b',
        decimals: 18,
      },
      moonbasealpha: {
        address: '0xd27d8883E31FAA11B2613b14BE83ad8951C8783C',
        decimals: 18,
      },
      solana: {
        address: '7VPWjBhCXrpYYBiRKZh1ubh9tLZZNkZGp2ReRphEV4Mc',
        decimals: 8,
      },
      sui: {
        address:
          '0x72831f626b1f0e11be201893d5cb641917730b1ccac778e4a77f8ab2052f0784::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0x381775005cb32cdd3dbf935ae1b978ed40d309c72b009cd4a812aab6d991418a::coin::T',
        decimals: 8,
      },
      base_sepolia: {
        address: '0x1BDD24840e119DC2602dCC587Dd182812427A5Cc',
        decimals: 18,
      },
      sei: {
        address:
          'sei13pzlt9etk44hj22lckncvampq2qu2gxv6r6774f3hma4vc07wqgsmftjx7',
        decimals: 8,
      },
      arbitrum_sepolia: {
        address: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
        decimals: 18,
      },
      optimism_sepolia: {
        address: '0x74A4A85C611679B73F402B36c0F84A7D2CcdFDa3',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole1vguuxez2h5ekltfj9gjd62fs5k4rl2zy5hfrncasykzw08rezpfs63pmq2',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/A4A8B6AE885DACD75B228031C0D18AD7EE1B914CED30C9F6F4230DDBD4A1CF2B',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/77FE9153FA76C3107CB9F6633AC33509A58529E9622327F216BA8107C79C2DE3',
        decimals: 8,
      },
    },
  },
  USDCeth: {
    key: 'USDCeth',
    symbol: 'USDC',
    nativeChain: 'sepolia',
    icon: Icon.USDC,
    tokenId: {
      chain: 'sepolia',
      address: '0x99cA9faa461bE470dCff54d5b2e5857ef253AEb8',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      mumbai: {
        address: '0x543237045a106D7fd2eE3e2B44b5728e70BDe9c3',
        decimals: 6,
      },
      bsc: {
        address: '0x861B5C16A2EcED022241072A7beA9D530b99EB6f',
        decimals: 6,
      },
      fuji: {
        address: '0x63A30f239DC8d1c17Bf6653a68Fc6C2F83641E6d',
        decimals: 6,
      },
      fantom: {
        address: '0xDF7928AF5B33F7de592594958D8d6Ff8472Eb407',
        decimals: 6,
      },
      alfajores: {
        address: '0xB0524bEF6c61c6150B340b2828a890fD8dEa60C0',
        decimals: 6,
      },
      moonbasealpha: {
        address: '0xE5dE10C4b744bac6b783fAF8d9B9fDFF14Acc3c9',
        decimals: 6,
      },
      solana: {
        address: '2BAqec7Qof3Y7VJatwFsRHUNSQBSkzaEsT1V5bW6dbZY',
        decimals: 6,
      },
      sei: {
        address:
          'sei1nj32y0h0vzam33ay42h2majlfk7tdkqcuk84srn0v2a52kmujgfsyfe78f',
        decimals: 6,
      },
      wormchain: {
        address:
          'wormhole1rl8su3hadqqq2v86lscpuklsh2mh84cxqvjdew4jt9yd07dzekyqkmcy3p',
        decimals: 6,
      },
      cosmoshub: {
        address:
          'ibc/D0EC31D1176BB69EA1A7CF7172CA0380B7AF488AFC6D55B101B8363C2141CD4F',
        decimals: 6,
      },
      osmosis: {
        address:
          'ibc/3BB8C4BD1C90599B2FA5B5839DD0813EF7B94B0BD0904C4C5A61498AE81E0EE9',
        decimals: 6,
      },
      sui: {
        address:
          '0x9e4396c19ec1c5f2214c79d3af3f31e59869640305560f8f2499c36fa9c8e0f2::coin::COIN',
        decimals: 6,
      },
    },
  },
  WBTC: {
    key: 'WBTC',
    symbol: 'WBTC',
    nativeChain: 'sepolia',
    icon: Icon.WBTC,
    tokenId: {
      chain: 'sepolia',
      address: '0x92f3B59a79bFf5dc60c0d59eA13a44D082B2bdFC',
    },
    coinGeckoId: 'wrapped-bitcoin',
    color: '#ffffff',
    decimals: {
      default: 8,
    },
  },
  USDT: {
    key: 'USDT',
    symbol: 'USDT',
    nativeChain: 'sepolia',
    icon: Icon.USDT,
    tokenId: {
      chain: 'sepolia',
      address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    },
    coinGeckoId: 'tether',
    color: '#ffffff',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      mumbai: {
        address: '0x02E30E84161BE1aBfcBB2b154B11De4C2b5E0a32',
        decimals: 6,
      },
      bsc: {
        address: '0xe94AaBAdB6F833f65B8A9AdDD030985B775188c9',
        decimals: 6,
      },
      moonbasealpha: {
        address: '0x7f5Ca1bcFb38fDF4c0E0646FCbf3FA87740ff65D',
        decimals: 6,
      },
      fantom: {
        address: '0x32eF19C4b3DF65a24972A489e70AdDef5E54262C',
        decimals: 6,
      },
      wormchain: {
        address:
          'wormhole1v2efcqkp2qtev06t0ksjnx6trxdd0f7fxg2zdrtzr8cr9wdpjkyqkv9ch6',
        decimals: 6,
      },
      cosmoshub: {
        address:
          'ibc/755FBC53FFB46FB505B5269F9BEDF47041F2A0EF2FF8D0520315403E5925C80A',
        decimals: 6,
      },
      osmosis: {
        address:
          'ibc/1941ED1147121BA7DF35559597B6EB3251844DBBBE4557337D957CB95E0978C2',
        decimals: 6,
      },
    },
  },
  DAI: {
    key: 'DAI',
    symbol: 'DAI',
    nativeChain: 'sepolia',
    icon: Icon.DAI,
    tokenId: {
      chain: 'sepolia',
      address: '0x68194a729C2450ad26072b3D33ADaCbcef39D574',
    },
    coinGeckoId: 'dai',
    color: '#FEFEFD',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      mumbai: {
        address: '0x87374d35C5F1bD78c2b1da383F460e154e7D3E5e',
        decimals: 18,
      },
      bsc: {
        address: '0x45082C9Fc6BBCa72288F47Fad21dE0BECC75759E',
        decimals: 18,
      },
      fuji: {
        address: '0x3989C9c4bdd30400E6Aa90990683EAd6a1638A16',
        decimals: 18,
      },
      fantom: {
        address: '0xE4FE5DF2084f9D81595e4fcba2399020FBE7b233',
        decimals: 18,
      },
      alfajores: {
        address: '0xeBB3fF6E5d61d3793Fdb60f7942BA78E636019f6',
        decimals: 18,
      },
      moonbasealpha: {
        address: '0xc31EC0108D8e886be58808B4C2C53f8365f1885D',
        decimals: 18,
      },
      solana: {
        address: '3WK3mEDNPrNuQReBvM28NcsqrExMnPxD9pPJmgrUeKKH',
        decimals: 8,
      },
      sui: {
        address:
          '0xe6fc78aa2b52b785bdcb67901cd85793a0b593248f315cb755974d23d0fcb837::coin::COIN',
        decimals: 8,
      },
      wormchain: {
        address:
          'wormhole1uuwad4khwek2h05gmkktzmh8l4t0ep54yydlsqg0l4y2uh3tqfyq3an9k6',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/5F21E975410DA22AF565B1772DC45AD0BD5F6DA004981EBE291763F3D2C72A96',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/2864B3418775DDB90EE1410EFF822FDA94E9F0FF77FC8771644761C79EDFE7A3',
        decimals: 8,
      },
    },
  },
  MATIC: {
    key: 'MATIC',
    symbol: 'MATIC',
    nativeChain: 'mumbai',
    icon: Icon.POLYGON,
    coinGeckoId: 'matic-network',
    color: '#8247E5',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WMATIC',
  },
  WMATIC: {
    key: 'WMATIC',
    symbol: 'WMATIC',
    nativeChain: 'mumbai',
    icon: Icon.POLYGON,
    tokenId: {
      chain: 'mumbai',
      address: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
    },
    coinGeckoId: 'matic-network',
    color: '#8247E5',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      bsc: {
        address: '0x7FCDA925f0994121752ca14C334297BeC3d0eA9E',
        decimals: 18,
      },
      fuji: {
        address: '0x78554394273957d7e55afC841aeA27Cce469AEd4',
        decimals: 18,
      },
      fantom: {
        address: '0x47a4C4c0f96D6CBe5b5C0A46CB0E22d6A17F1430',
        decimals: 18,
      },
      alfajores: {
        address: '0x7a56409988BBF8758b3ba412b9c7E3FE504C8544',
        decimals: 18,
      },
      moonbasealpha: {
        address: '0xD2888f015BcB76CE3d27b6024cdEFA16836d0dbb',
        decimals: 18,
      },
      solana: {
        address: 'ACbmcQxbbhiXWM1GmapUSMmBYKMvnFLfAAXKqdo8xKwo',
        decimals: 8,
      },
      sui: {
        address:
          '0xa516bcbf83b29a2944bb53ec9f934ea7d78c3626d3ae411d2fb9dcb977522e67::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0x5f229253e2b2d03fb909f565feca49452582bd633a5816e5ce30aa593cb49d8a::coin::T',
        decimals: 8,
      },
      sei: {
        address:
          'sei1dc94as3vgxn3qkr5h0lnnrep69mtfku6jg4t94gfkunuyzr5g5eqyqvj9p',
        decimals: 8,
      },
      wormchain: {
        address:
          'wormhole1vhjnzk9ly03dugffvzfcwgry4dgc8x0sv0nqqtfxj3ajn7rn5ghq6whn2p',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/37FB599287C6963C413E915FDE83EFA69A3CE8147675DD5A7F974B45F39C8A31',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/43F15553F8598186394E81E18604B8B4532B2D7E855D9FFE68A2EF6802C18BE4',
        decimals: 8,
      },
    },
  },
  USDCpolygon: {
    key: 'USDCpolygon',
    symbol: 'USDC',
    nativeChain: 'mumbai',
    icon: Icon.USDC,
    tokenId: {
      chain: 'mumbai',
      address: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {},
  },
  BNB: {
    key: 'BNB',
    symbol: 'BNB',
    nativeChain: 'bsc',
    icon: Icon.BNB,
    coinGeckoId: 'binancecoin',
    color: '#F3BA30',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WBNB',
  },
  WBNB: {
    key: 'WBNB',
    symbol: 'WBNB',
    nativeChain: 'bsc',
    icon: Icon.BNB,
    tokenId: {
      chain: 'bsc',
      address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
    },
    coinGeckoId: 'binancecoin',
    color: '#F3BA30',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      mumbai: {
        address: '0x0C63D8ADB69204b2946DcB945a6f16d97C255eE2',
        decimals: 18,
      },
      fuji: {
        address: '0x10F1053bF2884b28ee0Bd7a2dDBa237Af3511d29',
        decimals: 18,
      },
      fantom: {
        address: '0xfB174b43228950C2055CFc25AE93f2DCe8E2beF0',
        decimals: 18,
      },
      alfajores: {
        address: '0xa8050be9389466c3c524F10F131f244ACbf21A0D',
        decimals: 18,
      },
      moonbasealpha: {
        address: '0x6097E80331B0c6aF4F74D7F2363E70Cb2Fd078A5',
        decimals: 18,
      },
      solana: {
        address: 'BaGfF51MQ3a61papTRDYaNefBgTQ9ywnVne5fCff4bxT',
        decimals: 8,
      },
      sui: {
        address:
          '0xddcf8680a8a4b8a527d8c85ec203274991590c2ea898d1c4635b70164d9c584b::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0xa5894f5ddb8647e6143102aa336ff07374f7b32e88c1c703aef5b7c9a370bf80::coin::T',
        decimals: 8,
      },
      sei: {
        address:
          'sei10a7see3f9t2j9l8fdweur3aqy4zgvz583a268hhhln3yzps6l5mqnl4ua6',
        decimals: 8,
      },
      wormchain: {
        address:
          'wormhole1335rlmhujm0gj5e9gh7at9jpqvqckz0mpe4v284ar4lw5mlkryzsnetfsj',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/5B0D5974A56332468DD4B2D07C96A7386FCF8FE7303FF41234F90E410EF51937',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/65A67BA10DE2378B32AC5A822321E370966D3D4E180DEFB4C3C5245B21088DDF',
        decimals: 8,
      },
    },
  },
  AVAX: {
    key: 'AVAX',
    symbol: 'AVAX',
    nativeChain: 'fuji',
    icon: Icon.AVAX,
    coinGeckoId: 'avalanche-2',
    color: '#E84141',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WAVAX',
  },
  WAVAX: {
    key: 'WAVAX',
    symbol: 'WAVAX',
    nativeChain: 'fuji',
    icon: Icon.AVAX,
    tokenId: {
      chain: 'fuji',
      address: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c',
    },
    coinGeckoId: 'avalanche-2',
    color: '#E84141',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      mumbai: {
        address: '0x51f3D34651523dD8CC4872ee261A1B0B3f73AceF',
        decimals: 18,
      },
      bsc: {
        address: '0x6cE9E2c8b59bbcf65dA375D3d8AB503c8524caf7',
        decimals: 18,
      },
      fantom: {
        address: '0x0f545Be981C37fB15ab7c65404648761e99016e4',
        decimals: 18,
      },
      alfajores: {
        address: '0x502c8C83008D9Dd812a7C5fB886C063060C73Dbf',
        decimals: 18,
      },
      moonbasealpha: {
        address: '0x2E8afeCC19842229358f3650cc3F091908dcbaB4',
        decimals: 18,
      },
      solana: {
        address: '3Ftc5hTz9sG4huk79onufGiebJNDMZNL8HYgdMJ9E7JR',
        decimals: 8,
      },
      sui: {
        address:
          '0xa600741c469fb57ed01497ddf101e798fa79a9c529bd176675c5c4d970811f80::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0xbe8f4301c0b54e870902b9a23eeb95ce74ac190531782aa3262337ceb145401a::coin::T',
        decimals: 8,
      },
      sei: {
        address:
          'sei1mgpq67pj7p2acy5x7r5lz7fulxmuxr3uh5f0szyvqgvru3glufzsxk8tnx',
        decimals: 8,
      },
      wormchain: {
        address:
          'wormhole1tqwwyth34550lg2437m05mjnjp8w7h5ka7m70jtzpxn4uh2ktsmq8dv649',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/BAEAC83736444C09656FBE666FB625974FCCDEE566EB700EBFD2642C5F6CF13A',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/99EAD53D49EC7CC4E2E2EB26C22CF81C16727DF0C4BF7F7ACBF0D22D910DB5DE',
        decimals: 8,
      },
    },
  },
  USDCavax: {
    key: 'USDCavax',
    symbol: 'USDC',
    nativeChain: 'fuji',
    icon: Icon.USDC,
    tokenId: {
      chain: 'fuji',
      address: '0x5425890298aed601595a70AB815c96711a31Bc65',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      mumbai: {
        address: '0xcc048C353Fdc2f5c378B7BCab9B240Ca2b619f1c',
        decimals: 6,
      },
      bsc: {
        address: '0x1cfeCf72bcBE1E429A21A5B11E708C7c397AaC54',
        decimals: 6,
      },
      fantom: {
        address: '0x6BC4E8D8c1d54656D1DeBCa96efc53aFd1408aD2',
        decimals: 6,
      },
      alfajores: {
        address: '0xDDB349c976cA2C873644F21f594767Eb5390C831',
        decimals: 6,
      },
      moonbasealpha: {
        address: '0x6533CE14804D113b1F494dC56c5D60A43cb5C3b5',
        decimals: 6,
      },
      solana: {
        address: 'GQtMXZxnuacCFTXVeTvyHi6P9F6chbtzhVc8JgD8hv7c',
        decimals: 6,
      },
      sui: {
        address:
          '0x2aa8c885d04e676c4e87b7d0f94d4f3b243b1b5d93239d1cc41d5528ce1714c1::coin::COIN',
        decimals: 6,
      },
      aptos: {
        address:
          '0x02ef7697bdb33361ca39d228671203afc0dea3202e792d79d2072b761d87c834::coin::T',
        decimals: 6,
      },
      sei: {
        address:
          'sei1uyce5s6cc8hveg0maq2lg7wm6v6fvwqmznypj559nzf9wr9tmw3qnd3ce7',
        decimals: 6,
      },
      wormchain: {
        address:
          'wormhole1qum2tr7hh4y7ruzew68c64myjec0dq2s2njf6waja5t0w879lutqv2exs9',
        decimals: 6,
      },
      cosmoshub: {
        address:
          'ibc/F09E98FA8682FF39130F171E9D89A948B0C3A452F2A31F22B6CC54A3AAE1CD4A',
        decimals: 6,
      },
      osmosis: {
        address:
          'ibc/EC9FA5074F34F0644A025BB0263FDAE8F364C5E08523F6464465EF1010FF5A3A',
        decimals: 6,
      },
    },
  },
  FTM: {
    key: 'FTM',
    symbol: 'FTM',
    nativeChain: 'fantom',
    icon: Icon.FANTOM,
    coinGeckoId: 'fantom',
    color: '#12B4EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WFTM',
  },
  WFTM: {
    key: 'WFTM',
    symbol: 'WFTM',
    nativeChain: 'fantom',
    icon: Icon.FANTOM,
    tokenId: {
      chain: 'fantom',
      address: '0xf1277d1Ed8AD466beddF92ef448A132661956621',
    },
    coinGeckoId: 'fantom',
    color: '#12B4EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      mumbai: {
        address: '0x84aa9100a36D6c3514605F62342abF3cE77D5b97',
        decimals: 18,
      },
      bsc: {
        address: '0x9aB305B792DBdb8253bEE909E7006611Cb45175b',
        decimals: 18,
      },
      fuji: {
        address: '0x094cB577C21Ab1360178beE74B9591fa12216dAD',
        decimals: 18,
      },
      alfajores: {
        address: '0xE6F8710cA14CFe7F5aAAD3A799C3d1D92dCba938',
        decimals: 18,
      },
      moonbasealpha: {
        address: '0x566c1cebc6A4AFa1C122E039C4BEBe77043148Ee',
        decimals: 18,
      },
      solana: {
        address: 'DMw2tLaq1bVoAEKtkoUtieSk9bfCPUvubYLatTMsSVop',
        decimals: 8,
      },
      sui: {
        address:
          '0x14e756ff65e0ac810a5f69ca5276ef5b899a6df3c4717de1f85559d8b5ae6ea6::coin::COIN',
        decimals: 8,
      },
      sei: {
        address:
          'sei1cr3j7rxq0dhq04ksftmj8n2w096w9g7ck8fngkvk2lrmy3qwz56q9thu9u',
        decimals: 8,
      },
      aptos: {
        address:
          '0x533c6ade00d15d1e014c41e29e34853e87df92c4e01a6a3f41318dbd098048d6::coin::T',
        decimals: 8,
      },
      wormchain: {
        address:
          'wormhole1808lz8dp2c39vhm9gnemt7zzj95nvrmjepxp7v3w4skzrlyzcmnsxkduxf',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/145C6B688F70B0C2F6D87546A5974A75CE75B3A2940275B750E65797B2996157',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/919D8F138B7E71BB067C7301AB5C2D48415E8C3A2D9187861245CEC668F88E3C',
        decimals: 8,
      },
    },
  },
  CELO: {
    key: 'CELO',
    symbol: 'CELO',
    nativeChain: 'alfajores',
    icon: Icon.CELO,
    tokenId: {
      chain: 'alfajores',
      address: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
    },
    coinGeckoId: 'celo',
    color: '#35D07E',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      mumbai: {
        address: '0xAd027790A64331A11bd1b651739450cC9Dc0098F',
        decimals: 18,
      },
      bsc: {
        address: '0x1471698cBD9cAB0228F2EEA9303A2b3aA0ABDC2B',
        decimals: 18,
      },
      fuji: {
        address: '0xC66d9c2b33c347d4A4441975f4688fcD5DD4c441',
        decimals: 18,
      },
      fantom: {
        address: '0xB18E73a69c3Aaea39a610372537Cf8482622d199',
        decimals: 18,
      },
      moonbasealpha: {
        address: '0x3406a9b09adf0cb36DC04c1523C4b294C6b79513',
        decimals: 18,
      },
      solana: {
        address: '84F2QX9278ToDmA98u4A86xSV9hz1ovazr8zwGaX6qjS',
        decimals: 8,
      },
      sui: {
        address:
          '0x81868174a6b11e1acc337b3414f9912455435d486609fb8d50b34312865085f2::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0xecbb0f7e7d049499ca83ca1358344f56557886f6f7adc740d6734cce7bfc9a14::coin::T',
        decimals: 8,
      },
      sei: {
        address:
          'sei1yw4wv2zqg9xkn67zvq3azye0t8h0x9kgyg3d53jym24gxt49vdyswk5upj',
        decimals: 8,
      },
      wormchain: {
        address:
          'wormhole1e8z2wjelypwxw5sey62jvwjyup88w55q3h6m0x8jtwjf6sx5c7ys4mzydk',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/3A4EA3F8096856C0802F86B218DD74213B4C10224AA44BBD54AEAAA2ABF078BA',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/009206915358A002C852A2A2CBEDB8446D2D02E519C815087A01F8BDB4DF77BA',
        decimals: 8,
      },
    },
  },
  USDCalfajores: {
    key: 'USDCalfajores',
    symbol: 'USDC.e',
    nativeChain: 'alfajores',
    icon: Icon.USDC,
    tokenId: {
      chain: 'alfajores',
      address: '0x72CAaa7e9889E0a63e016748179b43911A3ec9e5',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
  },
  GLMR: {
    key: 'GLMR',
    symbol: 'GLMR',
    nativeChain: 'moonbasealpha',
    icon: Icon.GLMR,
    coinGeckoId: 'moonbeam',
    color: '#e1147b',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WGLMR',
  },
  WGLMR: {
    key: 'WGLMR',
    symbol: 'WGLMR',
    nativeChain: 'moonbasealpha',
    icon: Icon.GLMR,
    tokenId: {
      chain: 'moonbasealpha',
      address: '0xD909178CC99d318e4D46e7E66a972955859670E1',
    },
    coinGeckoId: 'moonbeam',
    color: '#e1147b',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      mumbai: {
        address: '0x693b9AC2199d989bDA8C9C5b5d7A3680B4f40dAa',
        decimals: 18,
      },
      bsc: {
        address: '0x5C31B36599ED7f06b09c0ffC7A2F928cE496F046',
        decimals: 18,
      },
      fuji: {
        address: '0xf080782DF38eD5228D2FC2882d13D56c8f1D6f21',
        decimals: 18,
      },
      fantom: {
        address: '0x41E3CFDFC255A4bF3C8D3560Bc8D3D9b5080338e',
        decimals: 18,
      },
      alfajores: {
        address: '0x132D2172D89cd9CfD480A8887c6bF92360fB460e',
        decimals: 18,
      },
      solana: {
        address: '8987WGkYa5viiZ9DD8sS3PB5XghKmWjkEgmzvwDuoAEc',
        decimals: 8,
      },
      sui: {
        address:
          '0xeffae382de96981f7ddd2d294429924827e8f325d612487a12d6a0b249171002::coin::COIN',
        decimals: 8,
      },
      sei: {
        address:
          'sei140m6xagmw0zesejzhsvk46zprgscr7tu94h36rwsutcsxcs4fmds9sevym',
        decimals: 8,
      },
      aptos: {
        address:
          '0x338373b6694f71dbeac5ca4a30503bf5f083888d71678aed31255de416be37c0::coin::T',
        decimals: 8,
      },
      wormchain: {
        address:
          'wormhole10sfpr8ykh9xn93u8xec4ed3990nmvh86e0vaegkauqhlkxspysyqwavrxx',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/1EEDF447A6B046B20C00B1497BED5947219AEEBE0D9A85235C85133A554DF7A4',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/7DB06BB67428510AFC3967DC90F5632C679D55D8C487A951A0EEC3160AF492A6',
        decimals: 8,
      },
    },
  },
  SOL: {
    key: 'SOL',
    symbol: 'SOL',
    nativeChain: 'solana',
    icon: Icon.SOLANA,
    coinGeckoId: 'solana',
    color: '#8457EF',
    decimals: {
      Ethereum: 9,
      Solana: 9,
      default: 8,
    },
    wrappedAsset: 'WSOL',
  },
  WSOL: {
    key: 'WSOL',
    symbol: 'WSOL',
    nativeChain: 'solana',
    tokenId: {
      chain: 'solana',
      address: 'So11111111111111111111111111111111111111112',
    },
    icon: Icon.SOLANA,
    coinGeckoId: 'solana',
    color: '#8457EF',
    decimals: {
      Ethereum: 9,
      Solana: 9,
      default: 8,
    },
    foreignAssets: {
      sepolia: {
        address: '0x357ECA9754fDc02A9860973E261FB08DE0f3b094',
        decimals: 9,
      },
      mumbai: {
        address: '0x0284B4994456Fae4cb56E4d33228d51B674EAD1b',
        decimals: 9,
      },
      bsc: {
        address: '0x30f19eBba919954FDc020B8A20aEF13ab5e02Af0',
        decimals: 9,
      },
      fuji: {
        address: '0xb10563644a6AB8948ee6d7f5b0a1fb15AaEa1E03',
        decimals: 9,
      },
      fantom: {
        address: '0xED1a08Fc69A7008d225890A96aaE258c465CC7ad',
        decimals: 9,
      },
      alfajores: {
        address: '0x05EEF2AE1A7A938D78598F7d9e8b97A9bED0c9eC',
        decimals: 9,
      },
      sui: {
        address:
          '0xbc03aaab4c11eb84df8bf39fdc714fa5d5b65b16eb7d155e22c74a68c8d4e17f::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0xdd89c0e695df0692205912fb69fc290418bed0dbe6e4573d744a6d5e6bab6c13::coin::T',
        decimals: 8,
      },
      sei: {
        address:
          'sei1at3xuugacwgu3ppx7fxzmtr3q6m3ztjuean9r2mwcnqupw28yezs7unxgz',
        decimals: 8,
      },
      wormchain: {
        address:
          'wormhole1gryz69gzl6mz2m66a4twg922jtlc47nlx73sxv88lvq86du5zvyqz3mt23',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/D3EA463A51E31B2B30BED1978575CAC145DBAB354B8A0EA5D4CFB12D737AF790',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/B5D53105A7AA2BEC4DA4B3304228F3856219AE7CF84A9023043C481629E3E319',
        decimals: 8,
      },
    },
  },
  USDCsol: {
    key: 'USDCsol',
    symbol: 'USDC',
    nativeChain: 'solana',
    tokenId: {
      chain: 'solana',
      address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    },
    icon: Icon.USDC,
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      bsc: {
        address: '0x51a3cc54eA30Da607974C5D07B8502599801AC08',
        decimals: 6,
      },
      wormchain: {
        address:
          'wormhole1ced9v4plkf25q8c6k9gz0guq6l4xyjujpjlvxfg8lpaqywkmamashswq7p',
        decimals: 6,
      },
      cosmoshub: {
        address:
          'ibc/26D8D6C63C8D37A5127591DDA905E04CC69CBD3A64F9DA3B1DA3FB0B6A7D9FA5',
        decimals: 6,
      },
      osmosis: {
        address:
          'ibc/35A0467DE5744662078DE8B36CBBE0CF0EAA022565A3E6630CB375DDEBB96E05',
        decimals: 6,
      },
    },
  },
  SUI: {
    key: 'SUI',
    symbol: 'SUI',
    nativeChain: 'sui',
    tokenId: {
      chain: 'sui',
      address: '0x2::sui::SUI',
    },
    icon: Icon.SUI,
    coinGeckoId: 'sui',
    color: '#8457EF',
    decimals: {
      Ethereum: 9,
      Sui: 9,
      default: 8,
    },
    foreignAssets: {
      mumbai: {
        address: '0x3dadA6f29f80A0427C4989E17a5a2ada17441841',
        decimals: 9,
      },
      bsc: {
        address: '0x5A73D76e09Af2E428EC64aE10F91B78AC990B298',
        decimals: 9,
      },
      fuji: {
        address: '0xfc5128F8556a6F059466E67740e6cC31EE5C2C47',
        decimals: 9,
      },
      fantom: {
        address: '0xd882AB49372eC093E8697B5153f54ab5e7738e3b',
        decimals: 9,
      },
      alfajores: {
        address: '0xa40d9E69ca9867C4bFbeC11Ce79C939991e9bf26',
        decimals: 9,
      },
      solana: {
        address: 'BJZ72CjPQojVoH68mzrd4VQ4nr6KuhbAGnhZEZCujKxY',
        decimals: 8,
      },
      aptos: {
        address:
          '0x7b22d0e02f653d4fd1caddcfa4719a2b329da56eb81d8f27db703f02466c26a5::coin::T',
        decimals: 8,
      },
      sei: {
        address:
          'sei1rhpcprr2pffe6ydf078a0qeslhnlywxh2t3wjax4489z0m29cj9swj5khc',
        decimals: 8,
      },
      moonbasealpha: {
        address: '0x2ed4B5B1071A3C676664E9085C0e3826542C1b27',
        decimals: 9,
      },
      wormchain: {
        address:
          'wormhole1yf4p93xu68j5fseupm4laj4k6f60gy7ynx6r5vvyr9c0hl3uy8vqpqd6h0',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/129EC6B8A41BE07F94DD267F552F4AE1D5EAEBB51634A1468556AF06C10C2692',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/30778BA41ADF2D8A70B90DB53C2E0251731A40276EF6737215BB1A6ED9E90078',
        decimals: 8,
      },
    },
  },
  APT: {
    key: 'APT',
    symbol: 'APT',
    nativeChain: 'aptos',
    tokenId: {
      chain: 'aptos',
      address: '0x1::aptos_coin::AptosCoin',
    },
    icon: Icon.APT,
    coinGeckoId: 'aptos',
    color: '#8457EF',
    decimals: {
      Ethereum: 8,
      default: 8,
    },
    foreignAssets: {
      mumbai: {
        address: '0x226B436043B537BD158e84fA199E2Aa36bf364f8',
        decimals: 8,
      },
      bsc: {
        address: '0x4A7Bd5E135f421057F97BbA8BCeeE5c18334f454',
        decimals: 8,
      },
      fuji: {
        address: '0x996a3f12C1FcD7339Ea8801f629201e4d42EAD04',
        decimals: 8,
      },
      fantom: {
        address: '0xAb2297E8994149BA91737944E40891881aF762a4',
        decimals: 8,
      },
      alfajores: {
        address: '0xAC0a2fF7DD597de863878a3372142b07B614C125',
        decimals: 8,
      },
      moonbasealpha: {
        address: '0xCaa2A1d3BbbA0D1466571e83b4E2CbE04252593D',
        decimals: 8,
      },
      solana: {
        address: '7EvFD3JKCJVdtkAYdaSVKJsrPEJCzy2neJha7TREGrCa',
        decimals: 8,
      },
      sei: {
        address:
          'sei1em74y5sts4h8y5zuhfdn4w5g8zs285qld3kczpk6rh32jpvjyqqsvv0pdt',
        decimals: 8,
      },
      wormchain: {
        address:
          'wormhole1u8rft0gee23fa6a0t4t88ualrza5lj8ses4aur0l66c7efpvjezqchv34j',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/0CCA5EB15BC2FE474E71DBC9698302CDE260B6F6548F91C30002F7CBF228197B',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/7C495BD95757ED662A897C139F1C9F18275A86EE7203A0B073E2DB12B1E19D63',
        decimals: 8,
      },
      sui: {
        address:
          '0x812d6feb8b84e55d47a0bfcae9fb6a4e7e09be5ec86ce0a729e0f67d5f59f477::coin::COIN',
        decimals: 8,
      },
    },
  },
  // https://developers.circle.com/stablecoins/docs/usdc-on-test-networks
  USDCarbitrum: {
    key: 'USDCarbitrum',
    symbol: 'USDC',
    nativeChain: 'arbitrum_sepolia',
    icon: Icon.USDC,
    tokenId: {
      chain: 'arbitrum_sepolia',
      address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      sepolia: {
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        decimals: 6,
      },
      alfajores: {
        address: '0x0C4AbF95Ff3d82d1F02f55e65050eA5bA062606E',
        decimals: 6,
      },
      wormchain: {
        address:
          'wormhole1s3pk90ccfl6ueehnj8s9pdgyjjlspmr3m5rv46arjh5v4g08dd0qrchjrk',
        decimals: 6,
      },
      cosmoshub: {
        address:
          'ibc/6D1B6A7A9EF692A279A6B5994C98C0D598D003D9203BE8309F14B6E57A58506E',
        decimals: 6,
      },
      aptos: {
        address:
          '0x3f0fdd44d96dae888d6c576218cf655458316a27c7bdc46537f61e531b10d3df::coin::T',
        decimals: 6,
      },
      osmosis: {
        address:
          'ibc/06ED2700071B5A9C582F51A556537DA94E69EF547E7E6CCD8BFA3D95C818A525',
        decimals: 6,
      },
      bsc: {
        address: '0xe3aA397cb6d93Cce4fAd9Cc9E796CCa5E50FB5ED',
        decimals: 6,
      },
    },
  },
  USDCoptimism: {
    key: 'USDCoptimism',
    symbol: 'USDC',
    nativeChain: 'optimis_sepolia',
    icon: Icon.USDC,
    tokenId: {
      chain: 'optimis_sepolia',
      address: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      moonbasealpha: {
        address: '0xf98E630a3DD4F21Cab7a37Bb01209cb62959169D',
        decimals: 6,
      },
      fantom: {
        address: '0x685B29e17440c42758Ab3F80FD3603EF01bebe9A',
        decimals: 6,
      },
      wormchain: {
        address:
          'wormhole1u5z7097gm57zvun9wqsx6jxej2gpdjhg9l9xfe58rhpm29rtjmfqfnl4yv',
        decimals: 6,
      },
      cosmoshub: {
        address:
          'ibc/CE3F2FE630DA6A1187F085CDC8D59BA8B20DA48F4866F2D71C5AB7A1D5859933',
        decimals: 6,
      },
      osmosis: {
        address:
          'ibc/0A98A3947189D7C368170C76C3EF49486DDBE095F34B72A3C7F92AEBE1013A1D',
        decimals: 6,
      },
      aptos: {
        address:
          '0xcff1d9820851201436ad225dcc4374a2d15f52a74109283eb9881be799677e92::coin::T',
        decimals: 6,
      },
      sui: {
        address:
          '0xbbc39df58a11072ceeac1f685393ca912d1a1bfd6e772053ec5a544f36124da::coin::COIN',
        decimals: 6,
      },
    },
  },
  USDCbase: {
    key: 'USDCbase',
    symbol: 'USDC',
    nativeChain: 'base_sepolia',
    icon: Icon.USDC,
    tokenId: {
      chain: 'base_sepolia',
      address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      moonbasealpha: {
        address: '0x7480641F5B00b4Fc39d6AaeC4Cd851EdEA7f31CF',
        decimals: 6,
      },
      sepolia: {
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        decimals: 6,
      },
      wormchain: {
        address:
          'wormhole1ja4txt6m0jjq0gmjtmv442f8wk0r5f5apaya0z55wwlrpg3p5xaq3qxw7h',
        decimals: 6,
      },
      cosmoshub: {
        address:
          'ibc/8560BA5F45C95AE716C05978E364F50C98347ACBEC745840C30F91611FA36698',
        decimals: 6,
      },
      osmosis: {
        address:
          'ibc/2E4F8BC7F7AF33752CF7E290CAD4417EE67CD18FFC0D099E6519A440E588E0CE',
        decimals: 6,
      },
      aptos: {
        address:
          '0xcfaabb3cb08ad612905dd6b2593d044ce857dfe5360148333b4635fb57d4d13f::coin::T',
        decimals: 6,
      },
      sui: {
        address:
          '0x4125940814a0ca87465a1a59092a7344633ad03b48ad7cda36d799d8558012c1::coin::COIN',
        decimals: 6,
      },
      sei: {
        address:
          'sei1lf6ghmrkd7gn5jlj6xw64suycpjy7g4s5q92fc2gef4f8q3znanq95mmgv',
        decimals: 6,
      },
    },
  },
  OSMO: {
    key: 'OSMO',
    symbol: 'OSMO',
    nativeChain: 'osmosis',
    tokenId: {
      chain: 'osmosis',
      address: 'uosmo',
    },
    icon: Icon.OSMO,
    coinGeckoId: 'osmosis',
    color: '#FFFFFF',
    decimals: {
      default: 6,
    },
  },
  tBTC: {
    key: 'tBTC',
    symbol: 'tBTC',
    nativeChain: 'sepolia',
    tokenId: {
      // https://github.com/threshold-network/threshold/blob/748d9188aec126b7b40830021636c14fa7b5caf9/docs/resources/contract-addresses/sepolia-testnet.md
      chain: 'sepolia',
      address: '0x517f2982701695D4E52f1ECFBEf3ba31Df470161',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
    foreignAssets: {
      bsc: {
        address: '0xE7176110261ef2FfC885dd568C1093f58F0aEee9',
        decimals: 18,
      },
      fuji: {
        address: '0x7E1779F65B644E5f98DdC4D2cB0A0106a7E6d9e1',
        decimals: 18,
      },
      fantom: {
        address: '0x66E080407407620844fE2083c33108BE55E087bc',
        decimals: 18,
      },
      alfajores: {
        address: '0x01a050Fc725F4E99aAD43Eb6f8481f38ee6231aD',
        decimals: 18,
      },
      moonbasealpha: {
        address: '0xf82E21cE03471983Afb9c2E3789Aa13a2d7242E8',
        decimals: 18,
      },
      solana: {
        address: 'FMYvcyMJJ22whB9m3T5g1oPKwM6jpLnFBXnrY6eXmCrp',
        decimals: 8,
      },
      sui: {
        address:
          '0xacf6784120b221a077ab0b84acc0b76930779eb55f157ea2492be4a60b808f6::coin::COIN',
        decimals: 8,
      },
      aptos: {
        address:
          '0x6e2d5d1a6d6d0e0c5db506ce64ead0530847a48b96516abbb08cdebe43fe3036::coin::T',
        decimals: 8,
      }
    },
  },
  tBTCoptimism: {
    key: 'tBTCoptimism',
    symbol: 'tBTC',
    nativeChain: 'optimism_sepolia',
    tokenId: {
      chain: 'optimism_sepolia',
      address: '0x9A82bE743f0120fA24893b1631B6b2817fD94b1D',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    }
  },
  tBTCarbitrum: {
    key: 'tBTCarbitrum',
    symbol: 'tBTC',
    nativeChain: 'arbitrum_sepolia',
    tokenId: {
      chain: 'arbitrum_sepolia',
      address: '0xb8f31A249bcb45267d06b9E51252c4793B917Cd0',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
    foreignAssets: {
      wormchain: {
        address:
          'wormhole1rm8ztmk20lrd6ex8uqq3yu7a6eyfjwvg53pcuuj22ffe2y8r3yzqr8j4v9',
        decimals: 8,
      },
    },
  },
  tBTCbase: {
    key: 'tBTCbase',
    symbol: 'tBTC',
    nativeChain: 'base_sepolia',
    tokenId: {
      chain: 'base_sepolia',
      address: '0xb8f31A249bcb45267d06b9E51252c4793B917Cd0',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
  },
  tBTCsol: {
    key: 'tBTCsol',
    symbol: 'tBTC',
    nativeChain: 'solana',
    tokenId: {
      chain: 'solana',
      address: '6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
    foreignAssets: {
      sei: {
        address:
          'sei1aj3uu9ejt8fk6rpjfhzluqnzqmv3enlndjmt8llkr7dn2dtz55xst4s3mn',
        decimals: 8,
      },
    },
  },
  wstETH: {
    key: 'wstETH',
    symbol: 'wstETH',
    nativeChain: 'sepolia',
    tokenId: {
      chain: 'sepolia', 
      address: '0xB82381A3fBD3FaFA77B3a7bE693342618240067b', // https://github.com/lidofinance/state-mate/blob/f50bab7be9284f6e15fdb24155fbba943810f0d1/configs/optimism/sepolia-testnet-wstETH.yaml#L5
    },
    icon: Icon.WSTETH,
    coinGeckoId: 'wrapped-steth',
    color: '#3AA3FF',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
    foreignAssets: {
      wormchain: {
        address:
          'wormhole1u2zdjcczjrenwmf57fmrpensk4the84azdm05m3unm387rm8asdsxqwfeu',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/5BB02667F9F0C8284FCF7716065C2779039817FBCB91E937F5149FE89FD8F202',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/C66B7DB3ED665D2F5FE8ED15E88B5913A37D80601E161C5E53A743DE12C0FB85',
        decimals: 8,
      },
    },
  },
  SEI: {
    key: 'SEI',
    symbol: 'SEI',
    nativeChain: 'sei',
    tokenId: {
      chain: 'sei',
      address: 'usei',
    },
    icon: Icon.SEI,
    coinGeckoId: 'sei-network',
    color: '#FFFFFF',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      mumbai: {
        address: '0xc5C0229B38564E1E8083031405Be8d6E6e3Bc462',
        decimals: 6,
      },
      bsc: {
        address: '0x79A8FFFCED130314eCC8782C846c4d8d4867A900',
        decimals: 6,
      },
      fuji: {
        address: '0xfe2eCDD1708aaebf1cF802C6124fAFb18B22dfEE',
        decimals: 6,
      },
      fantom: {
        address: '0x832e8050D6c64724500DE9B0ffe1CAc6c570a26d',
        decimals: 6,
      },
      alfajores: {
        address: '0x05Efb4aC79ef48a4830f517834c6f5f039F16832',
        decimals: 6,
      },
      moonbasealpha: {
        address: '0x1EdDe35B7e058194B457B8621285EaFA710f01ea',
        decimals: 6,
      },
      solana: {
        address: '8LFdfuhbfdH8oBzSKDgfPAxvLW24dCM9ttjBrBobURuk',
        decimals: 6,
      },
      sui: {
        address:
          '0x22c5cdaabaae4b6d3351f9bba9511b0aebb0662a6c209a360f0776e1e77a8438::coin::COIN',
        decimals: 6,
      },
      aptos: {
        address:
          '0xcae0ba0b7a435730ab65f1c8357d213e5cf9d4b377b96761745a8edaf9c9df6d::coin::T',
        decimals: 6,
      },
    },
  },
  ATOM: {
    key: 'ATOM',
    symbol: 'ATOM',
    nativeChain: 'cosmoshub',
    tokenId: {
      chain: 'cosmoshub',
      address: 'uatom',
    },
    icon: Icon.ATOM,
    coinGeckoId: 'cosmos-hub',
    color: '#6f7390',
    decimals: {
      default: 6,
    },
  },
  EVMOS: {
    key: 'EVMOS',
    symbol: 'EVMOS',
    nativeChain: 'evmos',
    tokenId: {
      chain: 'evmos',
      address: 'atevmos',
    },
    icon: Icon.EVMOS,
    coinGeckoId: 'evmos',
    color: '#ed4e33',
    decimals: {
      Cosmos: 18,
      Ethereum: 18,
      default: 8,
    },
  },
  KUJI: {
    key: 'KUJI',
    symbol: 'KUJI',
    nativeChain: 'kujira',
    tokenId: {
      chain: 'kujira',
      address: 'ukuji',
    },
    icon: Icon.KUJI,
    coinGeckoId: 'kujira',
    color: '#f51f1e',
    decimals: {
      default: 6,
    },
  },
  KLAY: {
    key: 'KLAY',
    symbol: 'KLAY',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    nativeChain: 'klaytn',
    icon: Icon.KLAY,
    coinGeckoId: 'klay-token',
    color: '#fa4212',
    wrappedAsset: 'WKLAY',
  },
  WKLAY: {
    key: 'WKLAY',
    symbol: 'WKLAY',
    displayName: 'wKLAY',
    nativeChain: 'klaytn',
    icon: Icon.KLAY,
    tokenId: {
      chain: 'klaytn',
      address: '0x0339d5Eb6D195Ba90B13ed1BCeAa97EbD198b106',
    },
    coinGeckoId: 'wrapped-klay',
    color: '#fa4212',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      mumbai: {
        address: '0x7b34f3711705eB2963fB856cda063C979de4749e',
        decimals: 18,
      },
      bsc: {
        address: '0x79D34FDb686B5D139949E4F92D83EEe376489176',
        decimals: 18,
      },
    },
  },
  ETHsepolia: {
    key: 'ETHsepolia',
    symbol: 'ETH',
    displayName: 'ETH (Sepolia)',
    nativeChain: 'sepolia',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#5794EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETHsepolia',
  },
  WETHsepolia: {
    key: 'WETHsepolia',
    symbol: 'WETH',
    displayName: 'WETH (Sepolia)',
    nativeChain: 'sepolia',
    icon: Icon.ETH,
    tokenId: {
      chain: 'sepolia',
      address: '0xeef12A83EE5b7161D3873317c8E0E7B76e0B5D9c',
    },
    coinGeckoId: 'ethereum',
    color: '#5794EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
  },
  USDCsepolia: {
    key: 'USDCsepolia',
    symbol: 'USDC',
    nativeChain: 'sepolia',
    icon: Icon.USDC,
    tokenId: {
      chain: 'sepolia',
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
  },
  ETHarbitrum_sepolia: {
    key: 'ETHarbitrum_sepolia',
    symbol: 'ETH',
    displayName: 'ETH (Arbitrum Sepolia)',
    nativeChain: 'arbitrum_sepolia',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#5794EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETHarbitrum_sepolia',
  },
  WETHarbitrum_sepolia: {
    key: 'WETHarbitrum_sepolia',
    symbol: 'WETH',
    displayName: 'WETH (Arbitrum Sepolia)',
    nativeChain: 'arbitrum_sepolia',
    icon: Icon.ETH,
    tokenId: {
      chain: 'arbitrum_sepolia',
      address: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
    },
    coinGeckoId: 'ethereum',
    color: '#5794EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
  },
  ETHbase_sepolia: {
    key: 'ETHbase_sepolia',
    symbol: 'ETH',
    displayName: 'ETH (Base Sepolia)',
    nativeChain: 'base_sepolia',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#5794EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETHbase_sepolia',
  },
  WETHbase_sepolia: {
    key: 'WETHbase_sepolia',
    symbol: 'WETH',
    displayName: 'WETH (Base Sepolia)',
    nativeChain: 'base_sepolia',
    icon: Icon.ETH,
    tokenId: {
      chain: 'base_sepolia',
      address: '0x4200000000000000000000000000000000000006',
    },
    coinGeckoId: 'ethereum',
    color: '#5794EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
  },
  ETHoptimism_sepolia: {
    key: 'ETHoptimism_sepolia',
    symbol: 'ETH',
    displayName: 'ETH (Optimism Sepolia)',
    nativeChain: 'optimism_sepolia',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#5794EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETHoptimism_sepolia',
  },
  WETHoptimism_sepolia: {
    key: 'WETHoptimism_sepolia',
    symbol: 'WETH',
    displayName: 'WETH (Optimism Sepolia)',
    nativeChain: 'optimism_sepolia',
    icon: Icon.ETH,
    tokenId: {
      chain: 'optimism_sepolia',
      address: '0x4200000000000000000000000000000000000006',
    },
    coinGeckoId: 'ethereum',
    color: '#5794EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
  },
  INJ: {
    key: 'INJ',
    symbol: 'INJ',
    nativeChain: 'injective',
    tokenId: {
      chain: 'injective',
      address: 'inj',
    },
    icon: Icon.INJ,
    coinGeckoId: 'injective-protocol',
    color: '#24DAC6',
    decimals: {
      default: 18,
    },
  },
  ETHscroll: {
    key: 'ETHscroll',
    symbol: 'ETH',
    displayName: 'ETH (Scroll)',
    nativeChain: 'scroll',
    icon: Icon.SCROLL,
    coinGeckoId: 'ethereum',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETHscroll',
  },
  WETHscroll: {
    key: 'WETHscroll',
    symbol: 'WETH',
    displayName: 'WETH (Scroll)',
    nativeChain: 'scroll',
    icon: Icon.SCROLL,
    tokenId: {
      chain: 'scroll',
      address: '0x5300000000000000000000000000000000000004',
    },
    coinGeckoId: 'ethereum',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
  },
  ETHblast: {
    key: 'ETHblast',
    symbol: 'ETH',
    displayName: 'ETH (Blast)',
    nativeChain: 'blast',
    icon: Icon.BLAST,
    coinGeckoId: 'ethereum',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETHblast',
  },
  WETHblast: {
    key: 'WETHblast',
    symbol: 'WETH',
    displayName: 'WETH (Blast)',
    nativeChain: 'blast',
    icon: Icon.BLAST,
    tokenId: {
      chain: 'blast',
      address: '0x9D020B1697035d9d54f115194c9e04a1e4Eb9aF7', // non-rebasing
    },
    coinGeckoId: 'ethereum',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
  },
  OKB: {
    key: 'OKB',
    symbol: 'OKB',
    nativeChain: 'xlayer',
    icon: Icon.XLAYER,
    coinGeckoId: 'okb',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WOKB',
  },
  WOKB: {
    key: 'WOKB',
    symbol: 'WOKB',
    nativeChain: 'xlayer',
    icon: Icon.XLAYER,
    tokenId: {
      chain: 'xlayer',
      address: '0xa2aFfd8301BfB3c5b815829f2F509f053556D21B',
    },
    coinGeckoId: 'okb',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
  },
  MNT: {
    key: 'MNT',
    symbol: 'MNT',
    nativeChain: 'mantle',
    icon: Icon.MANTLE,
    coinGeckoId: 'mantle',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WMNT',
  },
  WMNT: {
    key: 'WMNT',
    symbol: 'WMNT',
    nativeChain: 'mantle',
    icon: Icon.MANTLE,
    tokenId: {
      chain: 'mantle',
      address: '0xa4c4cb2A072eE99f77212Fa18c2B7Ca26DA23905',
    },
    coinGeckoId: 'mantle',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
  },
};
