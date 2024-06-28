import { Icon, TokensConfig } from '../types';

export const TESTNET_TOKENS: TokensConfig = {
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
};
