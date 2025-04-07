/*
MIT License

Copyright (c) 2024 nomad-xyz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
import * as ethers from 'ethers';

/**
 * The MultiProvider manages a collection of [Domains]{@link Domain} and allows
 * developers to enroll ethers Providers and Signers for each domain. It is
 * intended to enable faster multi-chain development by housing all chain
 * connections under a single roof.
 *
 * Generally, we intend developers inherit the MultiProvider. Which is to say,
 * the expected usage pattern is `class AppContext<T> extends MultiProvider<T>`.
 * This way, the `MultiProvider` registration methods are available on the app
 * context.
 *
 * However, the multiprovider also works well as a property on a `Context`
 * class.  E.g. `class AppContext<T> { protected provider: MultiProvider<T> }`
 *
 * The `Domain` type parameter to the MultiProvider specifies an internal data
 * carrier that describes chains. This can be as simple as a name and a number.
 * This is the logical place to insert app-specific chain information. E.g. if
 * your application needs to know the blocktime of a chain, it should be on the
 * `Domain` type.
 *
 * @example
 * import { MultiProvider, Domain } from '@nomad-xyz/multi-provider';
 * const myApp = new MultiProvider<Domain>();
 * myApp.registerDomain({name: 'Polygon', id: 50});
 * myApp.registerDomain({name: 'Ethereum', id: 1});
 * myApp.registerRpcProvider('Celo', 'https://forno.celo.org');
 * myApp.registerRpcProvider('Ethereum', '...');
 * myApp.registerSigner('Ethereum', someSigner);
 * myApp.registerSigner('Polygon', someSigner);
 */
export class MultiProvider<T extends Domain> {
  protected domains: Map<string, T>;
  protected signers: Map<string, ethers.Signer>;

  constructor() {
    this.domains = new Map();
    this.signers = new Map();
  }

  /**
   * Resgister a domain with the MultiProvider. This allows the multiprovider
   * to resolves tha domain info, and reference it by name or number.
   *
   * @param domain The Domain object to register.
   */
  registerDomain(domain: T): void {
    this.domains.set(domain.name, domain);
  }

  get registeredDomains(): Array<Readonly<T>> {
    return Array.from(this.domains.values());
  }

  get domainNumbers(): number[] {
    return this.registeredDomains.map((domain) => domain.domain);
  }

  get domainNames(): string[] {
    return Array.from(this.domains.keys());
  }

  get missingProviders(): string[] {
    return this.domainNames.filter((name) => !this.signers.has(name));
  }

  /**
   * Resolve a domain name (or number) to the canonical number.
   *
   * This function is used extensively to disambiguate domains.
   *
   * @param nameOrDomain A domain name or number.
   * @returns The canonical domain number.
   */
  resolveDomain(nameOrDomain: string | number): number {
    let domain: Domain | undefined;
    if (typeof nameOrDomain === 'number') {
      domain = this.registeredDomains.find((d) => d?.domain === nameOrDomain);
    } else if (typeof nameOrDomain === 'string') {
      domain = this.registeredDomains.find(
        (d) => d?.name.toLowerCase() === nameOrDomain.toLowerCase(),
      );
    }

    if (!domain) throw new UnknownDomainError(this, nameOrDomain);

    return domain.domain;
  }

  /**
   * Resolve the name of a registered {@link Domain}, from its name or number.
   *
   * Similar to `resolveDomain`.
   *
   * @param nameOrDomain A domain name or number.
   * @returns The name
   * @throws If the domain is unknown
   */
  resolveDomainName(nameOrDomain: string | number): string {
    let domain: Domain | undefined;
    if (typeof nameOrDomain === 'number') {
      domain = this.registeredDomains.find((d) => d?.domain === nameOrDomain);
    } else if (typeof nameOrDomain === 'string') {
      domain = this.registeredDomains.find(
        (d) => d?.name.toLowerCase() === nameOrDomain.toLowerCase(),
      );
    }

    if (!domain) throw new UnknownDomainError(this, nameOrDomain);
    return domain.name;
  }

  /**
   * Check whether the {@link MultiProvider} is aware of a domain.
   *
   * @param nameOrDomain A domain name or number.
   * @returns true if the {@link Domain} has been registered, else false.
   */
  knownDomain(nameOrDomain: string | number): boolean {
    try {
      this.resolveDomain(nameOrDomain);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get the registered {@link Domain} object (if any)
   *
   * @param nameOrDomain A domain name or number.
   * @returns A {@link Domain} (if the domain has been registered)
   */
  getDomain(nameOrDomain: number | string): T | undefined {
    let name = nameOrDomain;
    if (typeof name !== 'string') {
      name = this.resolveDomainName(nameOrDomain);
    }
    if (!name) return;
    return this.domains.get(name);
  }

  /**
   * Get the registered {@link Domain} object (or error)
   *
   * @param nameOrDomain A domain name or number.
   * @returns A {@link Domain}
   * @throws if the domain has not been registered
   */
  mustGetDomain(nameOrDomain: number | string): T {
    const domain = this.getDomain(nameOrDomain);
    if (!domain) throw new UnknownDomainError(this, nameOrDomain);
    return domain;
  }

  /**
   * Register an ethers Signer for a specified domain.
   *
   * @param nameOrDomain A domain name or number.
   * @param signer An ethers Signer to be used by requests to that domain.
   */
  registerSigner(nameOrDomain: string | number, signer: ethers.Signer): void {
    const domain = this.resolveDomainName(nameOrDomain);
    if (!signer.provider) {
      throw new Error('Signer does not permit reconnect and has no provider');
    }
    this.signers.set(domain, signer);
  }

  /**
   * Remove the registered ethers Signer from a domain.
   *
   * @param nameOrDomain A domain name or number.
   */
  unregisterSigner(nameOrDomain: string | number): void {
    const domain = this.resolveDomainName(nameOrDomain);
    if (!this.signers.has(domain)) {
      return;
    }
    this.signers.delete(domain);
  }

  /**
   * Clear all signers from all registered domains.
   */
  clearSigners(): void {
    this.domainNumbers.forEach((domain) => this.unregisterSigner(domain));
  }

  /**
   * A shortcut for registering a basic local privkey signer on a domain.
   *
   * @param nameOrDomain A domain name or number.
   * @param privkey A private key string passed to `ethers.Wallet`
   */
  registerWalletSigner(nameOrDomain: string | number, privkey: string): void {
    const domain = this.resolveDomain(nameOrDomain);
    const wallet = new ethers.Wallet(privkey);
    this.registerSigner(domain, wallet);
  }

  /**
   * Return the signer registered to a domain (if any).
   *
   * @param nameOrDomain A domain name or number.
   * @returns The registered signer (or undefined)
   */
  getSigner(nameOrDomain: string | number): ethers.Signer | undefined {
    const domain = this.resolveDomainName(nameOrDomain);
    return this.signers.get(domain);
  }

  /**
   * Get the Signer associated with a doman (or error)
   *
   * @param nameOrDomain A domain name or number.
   * @returns A Signer
   * @throws If no provider has been registered for the specified domain
   */
  mustGetSigner(nameOrDomain: string | number): ethers.Signer {
    const signer = this.getSigner(nameOrDomain);
    if (!signer) {
      throw new UnknownDomainError(this, nameOrDomain);
    }
    return signer;
  }

  /**
   * Returns the signer registered to a domain.
   *
   * @param nameOrDomain A domain name or number.
   * @returns A Signer (if any), otherwise undefined
   */
  getConnection(nameOrDomain: string | number): ethers.Signer | undefined {
    return this.getSigner(nameOrDomain);
  }

  /**
   * Get the Signer associated with a domain (or error)
   *
   * @param nameOrDomain A domain name or number.
   * @returns A Signer
   * @throws If no signer has been registered for the specified domain
   */
  mustGetConnection(nameOrDomain: string | number): ethers.Signer {
    const connection = this.getConnection(nameOrDomain);
    if (!connection) {
      throw new NoProviderError(this, nameOrDomain);
    }
    return connection;
  }

  /**
   * Resolves the address of a Signer on a domain (or undefined, if no Signer)
   *
   * @param nameOrDomain A domain name or number.
   * @returns A Promise for the address of the registered signer (if any)
   */
  async getAddress(nameOrDomain: string | number): Promise<string | undefined> {
    const signer = this.getSigner(nameOrDomain);
    return await signer?.getAddress();
  }
}

/**
 * Unreachable error. Useful for type narrowing.
 */
export class UnreachableError extends Error {
  constructor(extra?: string) {
    super(
      `Unreachable. You should not see this Error. Please file an issue at https://github.com/nomad-xyz/monorepo, including the full error output. Extra info: ${
        extra ?? 'none'
      }`,
    );
  }
}

/**
 * An error containing a multi-provider-based context
 */
export abstract class WithContext<
  D extends Domain,
  T extends MultiProvider<D>,
> extends Error {
  provider: T;

  constructor(provider: T, msg: string) {
    super(msg);
    this.provider = provider;
  }
}

/**
 * Thrown when attempting to access a domain not registered on the context
 */
export class UnknownDomainError<
  D extends Domain,
  T extends MultiProvider<D>,
> extends WithContext<D, T> {
  domain: string | number;

  constructor(provider: T, domain: string | number) {
    super(
      provider,
      `Attempted to access an unknown domain: ${domain}.\nHint: have you called \`context.registerDomain(...)\` yet?`,
    );
    this.name = 'UnknownDomainError';
    this.domain = domain;
  }
}

/**
 * Thrown when attempting to access contract data on a domain with no
 * registered provider
 */
export class NoProviderError<
  D extends Domain,
  T extends MultiProvider<D>,
> extends WithContext<D, T> {
  domain: string | number;
  domainName: string;
  domainNumber: number;

  constructor(provider: T, domain: string | number) {
    const domainName = provider.resolveDomainName(domain);
    const domainNumber = provider.resolveDomain(domain);

    super(
      provider,
      `Missing provider for domain: ${domainNumber} : ${domainName}.\nHint: Have you called \`context.registerProvider(${domain}, provider)\` yet?`,
    );
    this.name = 'NoProviderError';
    this.domain = domain;
    this.domainName = domainName;
    this.domainNumber = domainNumber;
  }
}

export interface Domain {
  name: string;
  domain: number;
}
