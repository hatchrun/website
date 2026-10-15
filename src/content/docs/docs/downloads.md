---
title: Downloads
description: What a hatchrun release ships, how to install it and how to check it.
---

The hosted service needs none of this: runners use the published
images and hatchrun.io runs the control plane. You need these files to
[self-host](/docs/self-hosting/) or to build your own runner image.

## What a release ships

Every [release of hatchrun/hatchrun](https://github.com/hatchrun/hatchrun/releases/latest)
has:

| File | What it is |
| --- | --- |
| `hatchrun-agent_VERSION_amd64.deb`, `hatchrun-agent_VERSION_arm64.deb` | The agent for Debian and Ubuntu runner images |
| `hatchrun-agent-VERSION-1.x86_64.rpm`, `hatchrun-agent-VERSION-1.aarch64.rpm` | The agent for RPM-based runner images |
| `hatchrun-agent-VERSION-linux-amd64.tar.gz`, `hatchrun-agent-VERSION-linux-arm64.tar.gz` | The agent binary and its systemd units |
| `hatchrun-scaler-VERSION-linux-amd64.tar.gz`, `hatchrun-scaler-VERSION-linux-arm64.tar.gz` | The scaler, a static binary |
| `hatchrun-agent-VERSION.cdx.json`, `hatchrun-scaler-VERSION.cdx.json` | CycloneDX SBOMs |
| `SHA256SUMS` | SHA-256 sums of every file above |

Each release also pushes the scaler image for amd64 and arm64 to
`ghcr.io/hatchrun/hatchrun-scaler:VERSION`, built from the same
binaries as the tarballs. The image has a tag per release and no
`latest` tag.

Runner AMIs come from a separate repository,
[hatchrun/images](https://github.com/hatchrun/images/releases). See
[Runner AMIs](#runner-amis) below.

Release tags start with `v` (`v0.21.0`); file names and image tags do
not (`0.21.0`). The commands on this page use `$VERSION` without the
`v`. To get the latest one:

```sh
VERSION=$(gh release view --repo hatchrun/hatchrun --json tagName -q .tagName | sed 's/^v//')
```

## The agent

The runner images already have the agent. Install it yourself only
when you build your own image. It installs `/usr/bin/hatchrun-agent`
and two systemd units, and leaves them disabled: the agent powers the
machine off when it exits, so it must only start on a runner instance.

On Debian or Ubuntu:

```sh
gh release download "v$VERSION" --repo hatchrun/hatchrun \
  --pattern "hatchrun-agent_${VERSION}_amd64.deb" --pattern SHA256SUMS
sha256sum --check --ignore-missing SHA256SUMS
sudo apt install "./hatchrun-agent_${VERSION}_amd64.deb"
sudo systemctl enable hatchrun-agent
```

On Fedora, RHEL or Amazon Linux:

```sh
gh release download "v$VERSION" --repo hatchrun/hatchrun \
  --pattern "hatchrun-agent-${VERSION}-1.x86_64.rpm" --pattern SHA256SUMS
sha256sum --check --ignore-missing SHA256SUMS
sudo dnf install "./hatchrun-agent-${VERSION}-1.x86_64.rpm"
sudo systemctl enable hatchrun-agent
```

From the tarball:

```sh
gh release download "v$VERSION" --repo hatchrun/hatchrun \
  --pattern "hatchrun-agent-${VERSION}-linux-amd64.tar.gz" --pattern SHA256SUMS
sha256sum --check --ignore-missing SHA256SUMS
tar -xzf "hatchrun-agent-${VERSION}-linux-amd64.tar.gz"
cd "hatchrun-agent-${VERSION}-linux-amd64"
sudo install -m 0755 hatchrun-agent /usr/bin/hatchrun-agent
sudo install -m 0644 hatchrun-agent.service hatchrun-launch.service /usr/lib/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable hatchrun-agent
```

For arm64, use `arm64` in the `.deb` and tarball names and `aarch64`
in the `.rpm` name. Without the GitHub CLI, the same files are at
`https://github.com/hatchrun/hatchrun/releases/download/v$VERSION/FILE`.

## The scaler

The container image is the easiest way to run the scaler. It holds the
static binary, CA certificates and nothing else, runs as user 65532 and
writes no files, so it works with a read-only root filesystem:

```sh
docker pull "ghcr.io/hatchrun/hatchrun-scaler:$VERSION"
docker run --rm --read-only "ghcr.io/hatchrun/hatchrun-scaler:$VERSION" --help
```

Podman takes the same commands:

```sh
podman pull "ghcr.io/hatchrun/hatchrun-scaler:$VERSION"
podman run --rm --read-only "ghcr.io/hatchrun/hatchrun-scaler:$VERSION" --help
```

To run the binary on a machine instead:

```sh
gh release download "v$VERSION" --repo hatchrun/hatchrun \
  --pattern "hatchrun-scaler-${VERSION}-linux-amd64.tar.gz" --pattern SHA256SUMS
sha256sum --check --ignore-missing SHA256SUMS
tar -xzf "hatchrun-scaler-${VERSION}-linux-amd64.tar.gz"
sudo install -m 0755 "hatchrun-scaler-${VERSION}-linux-amd64/hatchrun-scaler" /usr/local/bin/
hatchrun-scaler --version
```

[Self-hosting](/docs/self-hosting/) covers the flags and where to run
it.

## Runner AMIs

[hatchrun/images](https://github.com/hatchrun/images/releases) publishes
Ubuntu 26.04 AMIs for amd64 and arm64 through AWS Marketplace, free, in
every region enabled by default. Subscribe your account to the
[amd64](https://aws.amazon.com/marketplace/pp/prodview-znhn62372z6jq) and
[arm64](https://aws.amazon.com/marketplace/pp/prodview-nchg6i6uzlfr2) image once before you
launch them.

Each release has a `manifest.json` with the AMI id of every region and
architecture, and a CycloneDX SBOM per architecture. Read the id from
the latest release:

```sh
tag=$(gh release list --repo hatchrun/images --limit 1 --json tagName -q '.[0].tagName')
gh release download "$tag" --repo hatchrun/images --pattern manifest.json
gh attestation verify manifest.json --repo hatchrun/images
jq -r '.amis.arm64["eu-west-1"]' manifest.json
```

See [Runner images](/docs/images/) for what they contain.

## Verifying what you downloaded

### Checksums

`SHA256SUMS` lists every file of the release. `sha256sum --check
--ignore-missing SHA256SUMS` checks the files you downloaded and skips
the rest. The commands above run it before installing anything.

### Build provenance

The release workflow signs SLSA build provenance for every file and for
the image. It records the repository, workflow and commit that built
it. Check a file with the GitHub CLI:

```sh
gh attestation verify "hatchrun-agent_${VERSION}_amd64.deb" --repo hatchrun/hatchrun
```

Check the image by its tag. The CLI resolves the tag to a digest and
checks that digest:

```sh
gh attestation verify "oci://ghcr.io/hatchrun/hatchrun-scaler:$VERSION" --repo hatchrun/hatchrun
```

A file or image that was not built by the hatchrun/hatchrun release
workflow fails the check. A tag can be moved, a digest cannot, so run
the image you checked by its digest:

```sh
docker buildx imagetools inspect "ghcr.io/hatchrun/hatchrun-scaler:$VERSION" --format '{{.Manifest.Digest}}'
```

### SBOMs

`hatchrun-agent-VERSION.cdx.json` and `hatchrun-scaler-VERSION.cdx.json`
list the Rust crates in each binary, with versions and licences. The
scaler image holds the same binary, so its SBOM is the scaler's. The
SBOMs carry provenance like every other file. Feed them to a scanner
such as Trivy or Grype, or list the crates:

```sh
gh release download "v$VERSION" --repo hatchrun/hatchrun --pattern "hatchrun-scaler-${VERSION}.cdx.json"
gh attestation verify "hatchrun-scaler-${VERSION}.cdx.json" --repo hatchrun/hatchrun
jq -r '.components[] | "\(.name) \(.version)"' "hatchrun-scaler-${VERSION}.cdx.json"
```
