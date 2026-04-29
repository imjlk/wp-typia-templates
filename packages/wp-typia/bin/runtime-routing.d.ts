type RuntimeRoutingValues = readonly string[] | ReadonlySet<string>;

type RuntimeRoutingMetadata = {
  longValueOptions: RuntimeRoutingValues;
  reservedCommands: RuntimeRoutingValues;
  shortValueOptions: RuntimeRoutingValues;
};

type RuntimeRoutingStream = {
  isTTY?: boolean;
};

export declare function getRuntimeRoutingInvocation(
  argv: readonly string[],
  metadata: RuntimeRoutingMetadata,
): {
  command: string | undefined;
  isSinglePositionalAlias: boolean;
  positionals: string[];
};

export declare function shouldRouteToFullRuntime(options: {
  argv: readonly string[];
  fullRuntimeCommands: RuntimeRoutingValues;
  hasBuiltRuntime: boolean;
  hasWorkingBun: boolean;
  interactiveRuntimeCommands: RuntimeRoutingValues;
  longValueOptions: RuntimeRoutingValues;
  reservedCommands: RuntimeRoutingValues;
  shortValueOptions: RuntimeRoutingValues;
  stdin?: RuntimeRoutingStream;
  stdout?: RuntimeRoutingStream;
  term?: string;
}): boolean;
