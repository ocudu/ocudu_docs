#!/bin/bash

# SPDX-FileCopyrightText: Copyright (C) 2021-2026 Software Radio Systems Limited
# SPDX-License-Identifier: BSD-3-Clause-Open-MPI

. /usr/lib/tuned/functions

start() {
  # srsran performance script
  echo N | tee /sys/module/drm_kms_helper/parameters/poll >/dev/null
  echo performance | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor >/dev/null
  return "$?"
}

stop() {
  return "$?"
}

process $@
