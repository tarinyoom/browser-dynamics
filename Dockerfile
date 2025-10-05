FROM fedora:42

RUN dnf -y update && \
    dnf -y install git bash findutils which \
           nodejs npm rust cargo \
           rust-std-static-wasm32-unknown-unknown \
    && \
    dnf clean all

ARG USERNAME=dev
ARG UID=1000
ARG GID=1000
RUN groupadd -g ${GID} ${USERNAME} && \
    useradd -m -u ${UID} -g ${GID} -s /bin/bash ${USERNAME}

ENV PATH="/home/${USERNAME}/.cargo/bin:${PATH}"

USER ${USERNAME}
WORKDIR /home/${USERNAME}

ENV HOME=/home/${USERNAME}

RUN cargo install --locked wasm-pack

WORKDIR /work
