FROM fedora:42

RUN dnf -y update && \
    dnf -y install nodejs npm rust cargo git bash findutils which && \
    dnf clean all

ARG USERNAME=dev
ARG UID=1000
ARG GID=1000
RUN groupadd -g ${GID} ${USERNAME} && \
    useradd -m -u ${UID} -g ${GID} -s /bin/bash ${USERNAME}

WORKDIR /work
