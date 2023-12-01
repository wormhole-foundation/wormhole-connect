import { Icon, TokensConfig } from '../types';

export const TESTNET_TOKENS: TokensConfig = {
  ETH: {
    key: 'ETH',
    symbol: 'ETH',
    nativeChain: 'goerli',
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
    nativeChain: 'goerli',
    icon: Icon.ETH,
    tokenId: {
      chain: 'goerli',
      address: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
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
      basegoerli: {
        address: '0x44D627f900da8AdaC7561bD73aA745F132450798',
        decimals: 18,
      },
      sei: {
        address:
          'sei13pzlt9etk44hj22lckncvampq2qu2gxv6r6774f3hma4vc07wqgsmftjx7',
        decimals: 8,
      },
      arbitrumgoerli: {
        address: '0x285d75E04D78F53f4Ed29A506a7e8479EEf3035f',
        decimals: 18,
      },
      optimismgoerli: {
        address: '0x33Db338718aC89Cd8DB13B56af05be3a3029BBE5',
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
    nativeChain: 'goerli',
    icon: Icon.USDC,
    tokenId: {
      chain: 'goerli',
      address: '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
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
      basegoerli: {
        address: '0x5010B0988a035915C91a2a432085824FcB3D8d3f',
        decimals: 6,
      },
      sei: {
        address:
          'sei1nj32y0h0vzam33ay42h2majlfk7tdkqcuk84srn0v2a52kmujgfsyfe78f',
        decimals: 6,
      },
      arbitrumgoerli: {
        address: '0x42A212A2E7eA8feF4ED28F439F16A6ABDd34DA35',
        decimals: 6,
      },
      optimismgoerli: {
        address: '0x0382F518AcE1a86224c78B7CDfa67B9774055A1b',
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
    },
  },
  WBTC: {
    key: 'WBTC',
    symbol: 'WBTC',
    nativeChain: 'goerli',
    icon: Icon.WBTC,
    tokenId: {
      chain: 'goerli',
      address: '0xC04B0d3107736C32e19F1c62b2aF67BE61d63a05',
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
    nativeChain: 'goerli',
    icon: Icon.USDT,
    tokenId: {
      chain: 'goerli',
      address: '0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49',
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
      arbitrumgoerli: {
        address: '0x2B732F5ad6117818Ad3b7aC73C16033F6ECD78E5',
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
    nativeChain: 'goerli',
    icon: Icon.DAI,
    tokenId: {
      chain: 'goerli',
      address: '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844',
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
      basegoerli: {
        address: '0x31B2BAEE47Dc5Fc06baEC1BF73C124031b44fB97',
        decimals: 18,
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
      goerli: {
        address: '0x7cd0e8ff09cEB653813bD3d63d0554c1CB4BFdf6',
        decimals: 18,
      },
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
      basegoerli: {
        address: '0xFFB5d863d5132523d013338845A1Bb01EDd440f4',
        decimals: 18,
      },
      sei: {
        address:
          'sei1dc94as3vgxn3qkr5h0lnnrep69mtfku6jg4t94gfkunuyzr5g5eqyqvj9p',
        decimals: 8,
      },
      arbitrumgoerli: {
        address: '0x50FD4064cC536a964E2E0Dc7B3fE2313Ab386bEA',
        decimals: 18,
      },
      optimismgoerli: {
        address: '0x427B5a0b0384D7FD3AF81805A166a2d9C1116D7d',
        decimals: 18,
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
      address: '0x9999f7fea5938fd3b1e26a12c3f2fb024e194f97',
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
      goerli: {
        address: '0xB19693FEB013Bab65866dE0a845a9511064230cE',
        decimals: 18,
      },
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
      basegoerli: {
        address: '0x9DeF11E63C23c71dE3716b81dD2Fdad2B24b8b7F',
        decimals: 18,
      },
      sei: {
        address:
          'sei10a7see3f9t2j9l8fdweur3aqy4zgvz583a268hhhln3yzps6l5mqnl4ua6',
        decimals: 8,
      },
      arbitrumgoerli: {
        address: '0xB039aC4Fa8Ed99d30C2f7D791294A9d5FAd698eF',
        decimals: 18,
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
      goerli: {
        address: '0x4C1b727f6df3B075E682C41a25687A69846aaC04',
        decimals: 18,
      },
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
      basegoerli: {
        address: '0x410B0EE532EFfB18fa4d90cc095B1CD58aC43d5a',
        decimals: 18,
      },
      sei: {
        address:
          'sei1mgpq67pj7p2acy5x7r5lz7fulxmuxr3uh5f0szyvqgvru3glufzsxk8tnx',
        decimals: 8,
      },
      arbitrumgoerli: {
        address: '0x92b0C4D27a05921Ded4BB117755990F567aEe049',
        decimals: 18,
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
      goerli: {
        address: '0xF6699D3f725C4b64Cc6010F2DF77B4B05C76Cd5C',
        decimals: 6,
      },
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
      basegoerli: {
        address: '0x4C5208246676486064c501E1DAF2dD21596Bc5f5',
        decimals: 6,
      },
      sei: {
        address:
          'sei1uyce5s6cc8hveg0maq2lg7wm6v6fvwqmznypj559nzf9wr9tmw3qnd3ce7',
        decimals: 6,
      },
      arbitrumgoerli: {
        address: '0xb39697B8BA5df91A169690DfEf88B911436619F2',
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
      goerli: {
        address: '0x0d7A9Cdbb7C21E64825cF81750A5081a32aFb5d4',
        decimals: 18,
      },
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
      basegoerli: {
        address: '0xB4808E58713112AbAbB8167C7187F8988df38bbD',
        decimals: 18,
      },
      sei: {
        address:
          'sei1cr3j7rxq0dhq04ksftmj8n2w096w9g7ck8fngkvk2lrmy3qwz56q9thu9u',
        decimals: 8,
      },
      arbitrumgoerli: {
        address: '0xa507f7566B8aDE000E886166B95964677ef3b3Ef',
        decimals: 18,
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
      goerli: {
        address: '0xe092525a787CD56B901279b5864a224c22B95B72',
        decimals: 18,
      },
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
      basegoerli: {
        address: '0x72C56041ea5fe8bDE99b2A123fb5964cDE8C7FE9',
        decimals: 18,
      },
      sei: {
        address:
          'sei1yw4wv2zqg9xkn67zvq3azye0t8h0x9kgyg3d53jym24gxt49vdyswk5upj',
        decimals: 8,
      },
      arbitrumgoerli: {
        address: '0x9592eE6eD1D9E611b7aa6F20CCbD7Ba571Be8bdd',
        decimals: 18,
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
      goerli: {
        address: '0x0dc83BB61008A5E1194fe50fA9E474713C1AEcD7',
        decimals: 18,
      },
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
      basegoerli: {
        address: '0xCEc03b5710a464F4354AF35ebD0310238F656DFf',
        decimals: 18,
      },
      sei: {
        address:
          'sei140m6xagmw0zesejzhsvk46zprgscr7tu94h36rwsutcsxcs4fmds9sevym',
        decimals: 8,
      },
      optimismgoerli: {
        address: '0x99436d62259532E0407A7aE78A3b48D119B13903',
        decimals: 18,
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
      goerli: {
        address: '0x494701CE895389d917a938f0ea202D4eB9684Eab',
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
      basegoerli: {
        address: '0x6Fb1dE2372e48fe66c84cf37cc2fb54EaEe62988',
        decimals: 9,
      },
      sei: {
        address:
          'sei1at3xuugacwgu3ppx7fxzmtr3q6m3ztjuean9r2mwcnqupw28yezs7unxgz',
        decimals: 8,
      },
      arbitrumgoerli: {
        address: '0xF8cbdc4E54281b801f182039c250Ad6d13818250',
        decimals: 9,
      },
      optimismgoerli: {
        address: '0x06EcAF6638070Ccf3b3dEA421b3becAA57f3e559',
        decimals: 9,
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
      goerli: {
        address: '0x70F7360C49D227ccBbb98fB7B69B7CDB651195bb',
        decimals: 9,
      },
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
      basegoerli: {
        address: '0xEe0fC8BECD593B41AACBd93936fDAbc2A444370A',
        decimals: 9,
      },
      sei: {
        address:
          'sei1rhpcprr2pffe6ydf078a0qeslhnlywxh2t3wjax4489z0m29cj9swj5khc',
        decimals: 8,
      },
      arbitrumgoerli: {
        address: '0xe64e2139fdf6Ee7e3795FE51955e21bA3d9eB9F7',
        decimals: 9,
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
      goerli: {
        address: '0xd7A89a8DD20Cb4F252c7FB96B6421b37d82cE506',
        decimals: 8,
      },
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
      basegoerli: {
        address: '0xd934A15FfA3945DD0Ba2cb7b4174024261A14874',
        decimals: 8,
      },
      sei: {
        address:
          'sei1em74y5sts4h8y5zuhfdn4w5g8zs285qld3kczpk6rh32jpvjyqqsvv0pdt',
        decimals: 8,
      },
      arbitrumgoerli: {
        address: '0xa81C3BEf2d6f10213b860458DC119666C0ba13bf',
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
    },
  },
  ETHarbitrum: {
    key: 'ETHarbitrum',
    symbol: 'ETH',
    displayName: 'ETH (Arbitrum)',
    nativeChain: 'arbitrumgoerli',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#5794EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETHarbitrum',
  },
  WETHarbitrum: {
    key: 'WETHarbitrum',
    symbol: 'WETH',
    displayName: 'WETH (Arbitrum)',
    nativeChain: 'arbitrumgoerli',
    icon: Icon.ETH,
    tokenId: {
      chain: 'arbitrumgoerli',
      address: '0xee01c0cd76354c383b8c7b4e65ea88d00b06f36f',
    },
    coinGeckoId: 'ethereum',
    color: '#5794EC',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      bsc: {
        address: '0x60845E2503Fcd945b3A6f0bC077a31CC913E654D',
        decimals: 18,
      },
      fuji: {
        address: '0x36Bd1562F874941eE62Ebb2b3A45B4A88A9df90e',
        decimals: 18,
      },
      fantom: {
        address: '0x456e08952f9091B6c268dC0cECad53d141152C59',
        decimals: 18,
      },
      moonbasealpha: {
        address: '0x15025b956969DD8F1d0CD69959Ad97128F8f6D69',
        decimals: 18,
      },
      basegoerli: {
        address: '0x8eD43aBdc4f836aa60933177B31AC358ea09f27E',
        decimals: 18,
      },
      sei: {
        address:
          'sei1pf5j3dgngm8yj2xkwmvmvt87g4vyc0szpjz92q8ly9erh23ytn4s983htv',
        decimals: 8,
      },
      wormchain: {
        address:
          'wormhole186k0cp83c3wyvapgh8fxf66ededemzrfujvjfsx0xw3vr0u9g8sq2y30vx',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/AB4046AF5B6F146C006DE4DECAD929D24F762A701E09EC8B29000EC63A6E649B',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/221A4AADF7972F3BB8F48A6CA984FF0AE65B5D973FF1A695B9642AD702F51789',
        decimals: 8,
      },
    },
  },
  USDCarbitrum: {
    key: 'USDCarbitrum',
    symbol: 'USDC',
    nativeChain: 'arbitrumgoerli',
    icon: Icon.USDC,
    tokenId: {
      chain: 'arbitrumgoerli',
      address: '0xfd064A18f3BF249cf1f87FC203E90D8f650f2d63',
    },
    coinGeckoId: 'usd-coin',
    color: '#2774CA',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      goerli: {
        address: '0xd962F26D93c4eF609Ba00Ed6101326A1490B9489',
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
    },
  },
  ETHoptimism: {
    key: 'ETHoptimism',
    symbol: 'ETH',
    displayName: 'ETH (Optimism)',
    nativeChain: 'optimismgoerli',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#D53424',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETHoptimism',
  },
  WETHoptimism: {
    key: 'WETHoptimism',
    symbol: 'WETH',
    displayName: 'WETH (Optimism)',
    nativeChain: 'optimismgoerli',
    icon: Icon.ETH,
    tokenId: {
      chain: 'optimismgoerli',
      address: '0x4200000000000000000000000000000000000006',
    },
    coinGeckoId: 'ethereum',
    color: '#D53424',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      mumbai: {
        address: '0xC77d781f38Cf52F8Ea0b4c0F22312bB9A34911b5',
        decimals: 18,
      },
      fuji: {
        address: '0x301587BF484756441de43E522027e3751871237B',
        decimals: 18,
      },
      alfajores: {
        address: '0x28E768a51D19dcB753a24B79D1e89c92fee094Ba',
        decimals: 18,
      },
      basegoerli: {
        address: '0x5c443C05C72F0660502d88642c807020cc9b71A2',
        decimals: 18,
      },
      arbitrumgoerli: {
        address: '0xFd903eA23Bf65f26FdAf2eeb589cf007b108882E',
        decimals: 18,
      },
      wormchain: {
        address:
          'wormhole12eu6c7f67l8gdl2lt0hz0dgdh24dhune6wjgy5t0es3tpfzhc3yspwnpfy',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/A0298483510D803A045AA7F49CCBD0F9D01010FE0B1A346EBDFFF4BA820C3D21',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/80B3FECB24A4CE94537444E5BF937AC4C08A39BF90D59620D278FA185BD2B148',
        decimals: 8,
      },
    },
  },
  USDCoptimism: {
    key: 'USDCoptimism',
    symbol: 'USDC',
    nativeChain: 'optimismgoerli',
    icon: Icon.USDC,
    tokenId: {
      chain: 'optimismgoerli',
      address: '0xe05606174bac4A6364B31bd0eCA4bf4dD368f8C6',
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
    },
  },
  ETHbase: {
    key: 'ETHbase',
    symbol: 'ETH',
    displayName: 'ETH (Base)',
    nativeChain: 'basegoerli',
    icon: Icon.ETH,
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    wrappedAsset: 'WETHbase',
  },
  WETHbase: {
    key: 'WETHbase',
    symbol: 'WETH',
    displayName: 'WETH (Base)',
    nativeChain: 'basegoerli',
    icon: Icon.ETH,
    tokenId: {
      chain: 'basegoerli',
      address: '0x4200000000000000000000000000000000000006',
    },
    coinGeckoId: 'ethereum',
    color: '#62688F',
    decimals: {
      Ethereum: 18,
      default: 8,
    },
    foreignAssets: {
      goerli: {
        address: '0x76e39239e40857030D6f4D8545EFbd71F904d344',
        decimals: 18,
      },
      mumbai: {
        address: '0x68C4365d5229A44D9A59058B65500365492b5307',
        decimals: 18,
      },
      bsc: {
        address: '0x63108fC941F3cCE0B484De19746B5Af949EAF6eE',
        decimals: 18,
      },
      fuji: {
        address: '0xc07c754ef7473d315D973F7D9F7858C2eCe0a0a6',
        decimals: 18,
      },
      fantom: {
        address: '0x01950A33DfFa63E6Bc23b5dB440505581A4cc0e7',
        decimals: 18,
      },
      solana: {
        address: 'EKZqcBZ3Y7YTDinpecA7SxRp9B4s1m99VHJ9jpvyTwzW',
        decimals: 8,
      },
      aptos: {
        address:
          '0x5b5f14781164cf77185a7b6acd8e4f3cbb7e7cfb1cd5760d2b8af81075fc153d::coin::T',
        decimals: 8,
      },
      arbitrumgoerli: {
        address: '0xbC4CB3CD7186fD457C072298C48d0eDf7213CAEa',
        decimals: 18,
      },
      sei: {
        address:
          'sei1kdqylzcv86t7slg8m30mlfgna9xsrusghdgnavvurkv0rku7jvqqta7lka',
        decimals: 8,
      },
      sui: {
        address:
          '0x7b442b988864149dedfb9b6a75a88c7c33b9ddd3d15a87bf25104e1fcdd680ab::coin::COIN',
        decimals: 8,
      },
      wormchain: {
        address:
          'wormhole10p89p4zh00dwdg8h52sysrqm0l2j47jj3kmg93pnz2a039ucw7esgl5vl9',
        decimals: 8,
      },
      cosmoshub: {
        address:
          'ibc/97035986A4BD0AF555713355A02EA31A4526616B6543E019E0D750007FABE06C',
        decimals: 8,
      },
      osmosis: {
        address:
          'ibc/A45069EA82C933945973E66E4222EEE4624498D4483508FE9BEBF9D519F2132F',
        decimals: 8,
      },
    },
  },
  USDCbase: {
    key: 'USDCbase',
    symbol: 'USDC',
    nativeChain: 'basegoerli',
    icon: Icon.USDC,
    tokenId: {
      chain: 'basegoerli',
      address: '0xf175520c52418dfe19c8098071a252da48cd1c19',
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
      goerli: {
        address: '0x5aA392243437dDC8b4d86bfC90DF296908740A41',
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
    nativeChain: 'goerli',
    tokenId: {
      chain: 'goerli',
      address: '0x679874fBE6D4E7Cc54A59e315FF1eB266686a937',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
    foreignAssets: {
      mumbai: {
        address: '0xf6CC0Cc8D54a4b1A63a0E9745663e0c844Ee4D48',
        decimals: 18,
      },
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
      },
      basegoerli: {
        address: '0x0219441240d89fAc3fD708d06d8fD3A072C02FB6',
        decimals: 18,
      },
      arbitrumgoerli: {
        address: '0x97B5fE27a82b2B187D9a19C5782d9eB93B82DaC3',
        decimals: 18,
      },
      optimismgoerli: {
        address: '0x5D89a5BcB86F15a2CCAb05e7E3bEE23fDF246a64',
        decimals: 18,
      },
    },
  },
  tBTCpolygon: {
    key: 'tBTCpolygon',
    symbol: 'tBTC',
    nativeChain: 'mumbai',
    tokenId: {
      chain: 'mumbai',
      address: '0xBcD7917282E529BAA6f232DdDc75F3901245A492',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
  },
  tBTCoptimism: {
    key: 'tBTCoptimism',
    symbol: 'tBTC',
    nativeChain: 'optimismgoerli',
    tokenId: {
      chain: 'optimismgoerli',
      address: '0x1a53759DE2eADf73bd0b05c07a4F1F5B7912dA3d',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
  },
  tBTCarbitrum: {
    key: 'tBTCarbitrum',
    symbol: 'tBTC',
    nativeChain: 'arbitrumgoerli',
    tokenId: {
      chain: 'arbitrumgoerli',
      address: '0x85727F4725A4B2834e00Db1AA8e1b843a188162F',
    },
    icon: Icon.TBTC,
    coinGeckoId: 'tbtc',
    color: '#000000',
    decimals: {
      default: 8,
      Ethereum: 18,
    },
  },
  tBTCbase: {
    key: 'tBTCbase',
    symbol: 'tBTC',
    nativeChain: 'basegoerli',
    tokenId: {
      chain: 'basegoerli',
      address: '0x783349cd20f26CE12e747b1a17bC38D252c9e119',
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
  },
  wstETH: {
    key: 'wstETH',
    symbol: 'wstETH',
    nativeChain: 'goerli',
    tokenId: {
      chain: 'goerli',
      address: '0x6320cD32aA674d2898A68ec82e869385Fc5f7E2f',
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
    coinGeckoId: 'sei',
    color: '#FFFFFF',
    decimals: {
      default: 6,
    },
    foreignAssets: {
      goerli: {
        address: '0xd68df72136207E9471C915cf1B6Cf43D587D4E0A',
        decimals: 6,
      },
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
      basegoerli: {
        address: '0x7B5edB2B3d2BeA8057a736B82AC6EF35c70bdadD',
        decimals: 6,
      },
      arbitrumgoerli: {
        address: '0x90eC817A1f7C1Eb18dD2985C534A78dD88747F47',
        decimals: 6,
      },
      optimismgoerli: {
        address: '0xE12be3D96fE101246bF2d290184B0eC6D35d02CA',
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
};
