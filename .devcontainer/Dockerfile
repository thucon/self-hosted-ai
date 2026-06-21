FROM alpine:3.24.0

ARG HOME=/home/user
ARG USER=user
ARG GROUP=usergroup
ARG UID=1000
ARG GID=1000

ENV SHELL=/bin/bash

# Install alpine and pip packages
RUN apk --no-cache add bash openssh curl python3 py3-pip jq && \
    pip install --break-system-packages flask lmstudio

# Future commands are run via bash (instead of sh)
SHELL ["/bin/bash", "-c"]

# Create a group and user
RUN addgroup -g ${GID} -S ${GROUP} && \
    adduser \
    --disabled-password \
    --gecos "" \
    --home "${HOME}" \
    --ingroup "${GROUP}" \
    --uid "$UID" \
    "$USER"

# Tell docker that all future commands should run as the appuser user
RUN chown -R ${UID}:${GID} ${HOME}
USER ${USER}

# Create folders and update bash prompt
RUN mkdir -p ${HOME}/workspace && \
    echo 'export PS1="\u:\w\$ "' >> ${HOME}/.bashrc

# Setting workspace
WORKDIR ${HOME}/workspace